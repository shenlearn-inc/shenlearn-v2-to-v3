import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findAllStudents, findStudentsByIds, StudentV2} from "@/v2models/students";
import v2db from "@/db/v2db";
import {StudentSignV2} from "@/v2models/studentSigns";
import _ from "lodash"
import camelcaseKeys from "camelcase-keys";
import {CourseV2, findCoursesByIds} from "@/v2models/courses";
import {
  findAllNotAttendedStudentAttendances,
  StudentAttendanceV2
} from "@/v2models/studentAttendances";
import moment from "moment";
import {createStudentSchoolAttendances} from "@/v3models/studentSchoolAttendances";
import generateUUID from "@/utils/generateUUID";
import toStudentId from "@/utils/toStudentId";
import {findTeachersByIds, TeacherV2} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import {createStudentLessonAttendances, StudentLessonAttendanceV3} from "@/v3models/studentLessonAttendances";
import toClazzId from "@/utils/toClazzId";
import {findInclassCoursesByIds, InclassCourseV2} from "@/v2models/inclassCourses";
import v3db from "@/db/v3db";
import {TeacherV3} from "@/v3models/teachers";
import toLessonId from "@/utils/toLessonId";
import {Site} from "@/types/Site";

interface HandleStudentAttendanceProps {
  v2Student: StudentV2
  schoolId: string
  serviceDirector: TeacherV3,
  site: Site
  trxs: Trxs
}

// 處理學生出勤
const handleStudentAttendance = async ({
                                         v2Student,
                                         serviceDirector,
                                         schoolId,
                                         site,
                                         trxs
                                       }: HandleStudentAttendanceProps) => {
  // 找出學生
  console.info(`正在處理學生 ${v2Student.hashedId}`)

  const studentId = toStudentId(v2Student.hashedId)

  const studentSignIns = camelcaseKeys(
    await v2db()
      .select('*')
      .from('student_signs')
      .where({
        student_id: v2Student.id,
        status: true,
        deleted_at: null,
      })
      .orderBy('created_at', 'desc')
  ) as StudentSignV2[]

  const studentSignOuts = camelcaseKeys(
    await v2db()
      .select('*')
      .from('student_signs')
      .where({
        student_id: v2Student.id,
        status: false,
        deleted_at: null,
      })
      .orderBy('created_at', 'desc')
  ) as StudentSignV2[]

  if (!studentSignIns.length || !studentSignOuts.length) {
    return;
  }

  const v2Teachers = await findTeachersByIds(
    Array.from(new Set(
      studentSignIns.map(s => s.teacherId)
        .concat(studentSignOuts.map(s => s.teacherId))
        .filter(s => !!s)
    )) as number[],
    trxs,
  ) as TeacherV2[]
  const v2TeacherMap = _.keyBy(v2Teachers, 'id')

  const maxStudentSignOut: StudentSignV2 = _.maxBy(studentSignOuts, 'createdAt')!;
  const minStudentSignIn: StudentSignV2 = _.minBy(studentSignIns, 'createdAt')!;

  const v2StudentAttendances = camelcaseKeys(await v2db()
    .select('*')
    .from('student_attendances')
    .where({
      student_id: v2Student.id,
      deleted_at: null,
    })
    .where('attended_at', '>=', minStudentSignIn.createdAt)
    .where('attended_at', '<=', maxStudentSignOut.createdAt)
    .orderBy('attended_at', 'desc')) as StudentAttendanceV2[]

  const v2Courses = await findCoursesByIds(v2StudentAttendances.map(a => a.courseId), trxs) as CourseV2[]
  const v2CourseMap = _.keyBy(v2Courses, 'id')

  const v2InclassCourses = await findInclassCoursesByIds(v2StudentAttendances.map(a => a.inclassCourseId).filter(id => !!id) as number[], trxs) as InclassCourseV2[]
  const v2InclassCourseMap = _.keyBy(v2InclassCourses, 'id')

  const isOffset: boolean = false;
  for (let i = 0; i < studentSignIns.length; i++) {
    let attendances: StudentLessonAttendanceV3[] = []

    if (site?.isHandleDuplicateHashedId) {
      const isExisted = await v3db().first().from("student_school_attendances").where("id", generateUUID(studentSignIns[i].hashedId))
      if (isExisted) {
        // 產出新 hashedId
        const newHashedId = studentSignIns[i].hashedId + "00000";
        await v2db().from("student_signs").update({hashed_id: newHashedId}).where({id: studentSignIns[i].id}).transacting(trxs.v2db)
        studentSignIns[i].hashedId = newHashedId
      }
    }
    const schoolAttendanceId = generateUUID(studentSignIns[i].hashedId);
    const v2TeacherId = studentSignIns[i].teacherId!

    if (!!v2Student.inclass && !isOffset) {
      // 轉移簽到
      await createStudentSchoolAttendances([{
        id: schoolAttendanceId,
        studentId: studentId,
        schoolId: schoolId,
        startedAt: studentSignIns[i].createdAt,
        starterId: v2TeacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[v2TeacherId].hashedId) : null,
        starterType: null,
        endedAt: i === 0 ? null : studentSignOuts[i - 1]?.createdAt ?? new Date(),
        enderId: v2TeacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[v2TeacherId].hashedId) : null,
        enderType: null,
        createdAt: studentSignIns[i].createdAt ?? new Date(),
        updatedAt: studentSignIns[i].updatedAt ?? new Date(),
        deletedAt: null,
      }], trxs)
    } else {
      await createStudentSchoolAttendances([{
        id: schoolAttendanceId,
        studentId: studentId,
        schoolId: schoolId,
        startedAt: studentSignIns[i].createdAt,
        starterId: v2TeacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[v2TeacherId].hashedId) : null,
        starterType: null,
        endedAt: studentSignOuts[i]?.createdAt ?? null,
        enderId: v2TeacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[v2TeacherId].hashedId) : null,
        enderType: null,
        createdAt: studentSignIns[i].createdAt ?? new Date(),
        updatedAt: studentSignIns[i].updatedAt ?? new Date(),
        deletedAt: null,
      }], trxs)
    }

    for (let j = 0; j < v2StudentAttendances.length; j++) {
      if (site?.isHandleDuplicateHashedId) {
        // const isExisted = await v3db().first().from("student_lesson_attendances").where("id", generateUUID(v2StudentAttendances[j].hashedId))
        // if (isExisted) {
        // 產出新 hashedId
        const newHashedId = v2StudentAttendances[j].hashedId + "00000";
        // await v2db().from("student_attendances").update({ hashed_id: newHashedId }).where({ id: v2StudentAttendances[j].id }).transacting(trxs.v2db)
        v2StudentAttendances[j].hashedId = newHashedId
        // }
      }
      if (i === 0) {
        if (moment(v2StudentAttendances[j].attendedAt).isSameOrAfter(studentSignIns[i].createdAt)) {
          const a = v2StudentAttendances[j]
          if (a.courseId in v2CourseMap) {
            attendances.push({
              id: generateUUID(a.hashedId),
              schoolId: schoolId,
              clazzId: toClazzId(v2CourseMap[a.courseId].hashedId),
              lessonId: generateUUID(v2InclassCourseMap[a.inclassCourseId!].hashedId),
              studentId: studentId,
              studentSchoolAttendanceId: generateUUID(studentSignIns[i].hashedId),
              attendAt: a.attendedAt,
              leaveAt: a.leftAt,
              remark: a.remark ?? '',
              teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : serviceDirector.id,
              createdAt: a.createdAt ?? new Date(),
              updatedAt: a.updatedAt ?? new Date(),
              deletedAt: a.deletedAt,
            });
          }
          v2StudentAttendances.splice(j, 1);
          j = -1;
        }
      } else if (i === studentSignIns.length - 1) {
        attendances = v2StudentAttendances.map(a => ({
          id: generateUUID(a.hashedId),
          schoolId: schoolId,
          clazzId: toClazzId(v2CourseMap[a.courseId].hashedId),
          lessonId: generateUUID(v2InclassCourseMap[a.inclassCourseId!].hashedId),
          studentId: studentId,
          studentSchoolAttendanceId: generateUUID(studentSignIns[i].hashedId),
          attendAt: a.attendedAt,
          leaveAt: a.leftAt,
          remark: a.remark ?? '',
          teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : serviceDirector.id,
          createdAt: a.createdAt ?? new Date(),
          updatedAt: a.updatedAt ?? new Date(),
          deletedAt: a.deletedAt,
        }));
        break;
      } else {
        if (moment(v2StudentAttendances[j].attendedAt).isBetween(studentSignIns[i].createdAt, studentSignIns[i - 1].createdAt, null, '[)')) {
          const a = v2StudentAttendances[j]
          if (a.courseId in v2CourseMap) {
            attendances.push({
              id: generateUUID(a.hashedId),
              schoolId: schoolId,
              clazzId: toClazzId(v2CourseMap[a.courseId].hashedId),
              lessonId: generateUUID(v2InclassCourseMap[a.inclassCourseId!].hashedId),
              studentId: studentId,
              studentSchoolAttendanceId: generateUUID(studentSignIns[i].hashedId),
              attendAt: a.attendedAt,
              leaveAt: a.leftAt,
              remark: a.remark ?? '',
              teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : serviceDirector.id,
              createdAt: a.createdAt ?? new Date(),
              updatedAt: a.updatedAt ?? new Date(),
              deletedAt: a.deletedAt,
            });
          }
          v2StudentAttendances.splice(j, 1);
          j = -1;
        }
      }
    }

    await createStudentLessonAttendances(attendances, trxs)
  }
}

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移出勤')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .transacting(trxs.v3db) as TeacherV3

  const v2AllStudents = await findAllStudents(Number.MAX_SAFE_INTEGER, 0, trxs)

  const { default: PQueue } = await import("p-queue");
  const queue = new PQueue({concurrency: 10});

  v2AllStudents.forEach(v2Student => {
    queue.add(() => handleStudentAttendance({
      v2Student,
      serviceDirector,
      schoolId,
      site,
      trxs
    })).catch((error: any) => {
      console.log('處理學生出勤出錯: ', {
        studentId: v2Student.hashedId,
        error
      });
    });
  });

  await queue.onIdle();
  console.log('所有學生出勤處理完成');

  // 轉移全部班級出勤
  // 找出班級出勤
  const v2StudentAttendances = (await findAllNotAttendedStudentAttendances(Number.MAX_SAFE_INTEGER, 0, trxs)).filter(a => !!a.studentId)

  const [v2Courses, v2InclassCourses, v2Students, v2Teachers] = await Promise.all([
    findCoursesByIds(Array.from(new Set(v2StudentAttendances.map(a => a.courseId))), trxs),
    findInclassCoursesByIds(Array.from(new Set(v2StudentAttendances.map(a => a.inclassCourseId))).filter(id => !!id) as number[], trxs),
    findStudentsByIds(Array.from(new Set(v2StudentAttendances.map(a => a.studentId))), trxs),
    findTeachersByIds(Array.from(new Set(v2StudentAttendances.map(a => a.studentId))), trxs)
  ]) as [CourseV2[], InclassCourseV2[], StudentV2[], TeacherV2[]]

  const v2CourseMap = _.keyBy(v2Courses, 'id')
  const v2InclassCourseMap = _.keyBy(v2InclassCourses, 'id')
  const v2StudentMap = _.keyBy(v2Students, 'id')
  const v2TeacherMap = _.keyBy(v2Teachers, 'id')

  await createStudentLessonAttendances(
    v2StudentAttendances
      .filter(a => a.inclassCourseId && a.inclassCourseId in v2InclassCourseMap)
      .map(a => {
        return {
          id: generateUUID(site?.isHandleDuplicateHashedId ? `${a.hashedId}00000` : a.hashedId),
          schoolId: schoolId,
          clazzId: toClazzId(v2CourseMap[a.courseId].hashedId),
          lessonId: toLessonId(v2InclassCourseMap[a.inclassCourseId!].hashedId),
          studentId: toStudentId(v2StudentMap[a.studentId].hashedId),
          studentSchoolAttendanceId: null,
          attendAt: a.attendedAt,
          leaveAt: a.leftAt,
          remark: a.remark ?? '',
          teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : serviceDirector.id,
          createdAt: a.createdAt ?? new Date(),
          updatedAt: a.updatedAt ?? new Date(),
          deletedAt: a.deletedAt,
        }
      }),
    trxs,
  )
}
