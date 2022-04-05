import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findAllStudents, findStudentsByIds, getNumberOfStudent, StudentV2} from "@/v2models/students";
import config from "@/config";
import v2db from "@/db/v2db";
import {StudentSignV2} from "@/v2models/studentSigns";
import _ from "lodash"
import camelcaseKeys from "camelcase-keys";
import {CourseV2, findCoursesByIds} from "@/v2models/courses";
import {
  findAllNotAttendedStudentAttendances, getNumberOfNotAttendedStudentAttendance,
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

export default async (trxs: Trxs) => {
  console.info('轉移出勤')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 取得 service 帳號
  const serviceDirector = await v2db()
    .first()
    .from('teachers')
    .where('name', 'Service') as TeacherV2

  const numberOfStudent = await getNumberOfStudent(trxs)
  // 處理學生出勤
  for (let i = 0; i < numberOfStudent; i++) {
    // 找出學生
    const [v2Student] = await findAllStudents(1, i, trxs)
    console.info(`正在處理學生 ${v2Student.hashedId}`)

    const studentId = toStudentId(v2Student.hashedId)

    const studentSignIns = camelcaseKeys(await v2db()
      .select('*')
      .from('student_signs')
      .where({
        student_id: v2Student.id,
        status: true,
        deleted_at: null,
      })) as StudentSignV2[]

    const studentSignOuts = camelcaseKeys(await v2db()
      .select('*')
      .from('student_signs')
      .where({
        student_id: v2Student.id,
        status: false,
        deleted_at: null,
      })) as StudentSignV2[]

    if (!studentSignIns.length || !studentSignOuts.length) {
      continue
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

      const schoolAttendanceId = generateUUID(studentSignIns[i].hashedId)
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
          endedAt: i === 0 ? null : studentSignOuts[i - 1].createdAt,
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
          endedAt: studentSignOuts[i].createdAt,
          enderId: v2TeacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[v2TeacherId].hashedId) : null,
          enderType: null,
          createdAt: studentSignIns[i].createdAt ?? new Date(),
          updatedAt: studentSignIns[i].updatedAt ?? new Date(),
          deletedAt: null,
        }], trxs)
      }

      for (let j = 0; j < v2StudentAttendances.length; j++) {
        console.log(`attendAt ${v2StudentAttendances[j].attendedAt} signAt ${studentSignIns[i].createdAt}`)
        console.log(moment(v2StudentAttendances[j].attendedAt).isSameOrAfter(studentSignIns[i].createdAt))

        if (i === 0) {
          if (moment(v2StudentAttendances[j].attendedAt).isSameOrAfter(studentSignIns[i].createdAt)) {
            const a = v2StudentAttendances[j]
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
              teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : toTeacherId(serviceDirector.hashedId),
              createdAt: a.createdAt ?? new Date(),
              updatedAt: a.updatedAt ?? new Date(),
              deletedAt: a.deletedAt,
            });
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
            teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : toTeacherId(serviceDirector.hashedId),
            createdAt: a.createdAt ?? new Date(),
            updatedAt: a.updatedAt ?? new Date(),
            deletedAt: a.deletedAt,
          }));
          break;
        } else {
          if (moment(v2StudentAttendances[j].attendedAt).isBetween(studentSignIns[i].createdAt, studentSignIns[i - 1].createdAt, null, '[)')) {
            const a = v2StudentAttendances[j]
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
              teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : toTeacherId(serviceDirector.hashedId),
              createdAt: a.createdAt ?? new Date(),
              updatedAt: a.updatedAt ?? new Date(),
              deletedAt: a.deletedAt,
            });
            v2StudentAttendances.splice(j, 1);
            j = -1;
          }
        }
      }

      await createStudentLessonAttendances(attendances, trxs)
    }
  }

  // 轉移全部班級出勤
  const numberOfNotAttendedStudentAttendance = await getNumberOfNotAttendedStudentAttendance(trxs)
  for (let i = 0; i < Math.ceil(numberOfNotAttendedStudentAttendance / config.chunkSize); i++) {
    // 找出班級出勤
    const v2StudentAttendances = await findAllNotAttendedStudentAttendances(config.chunkSize, i * config.chunkSize, trxs)

    const v2Courses = await findCoursesByIds(Array.from(new Set(v2StudentAttendances.map(a => a.courseId))), trxs) as CourseV2[]
    const v2CourseMap = _.keyBy(v2Courses, 'id')

    const v2InclassCourses = await findInclassCoursesByIds(Array.from(new Set(v2StudentAttendances.map(a => a.inclassCourseId))).filter(id => !!id) as number[], trxs) as InclassCourseV2[]
    const v2InclassCourseMap = _.keyBy(v2InclassCourses, 'id')

    const v2Students = await findStudentsByIds(Array.from(new Set(v2StudentAttendances.map(a => a.studentId))), trxs) as StudentV2[]
    const v2StudentMap = _.keyBy(v2Students, 'id')

    const v2Teachers = await findTeachersByIds(Array.from(new Set(v2StudentAttendances.map(a => a.studentId))), trxs) as TeacherV2[]
    const v2TeacherMap = _.keyBy(v2Teachers, 'id')

    await createStudentLessonAttendances(
      v2StudentAttendances.map(a => {
        return {
          id: generateUUID(a.hashedId),
          schoolId: schoolId,
          clazzId: toClazzId(v2CourseMap[a.courseId].hashedId),
          lessonId: generateUUID(v2InclassCourseMap[a.inclassCourseId!].hashedId),
          studentId: toStudentId(v2StudentMap[a.studentId].hashedId),
          studentSchoolAttendanceId: null,
          attendAt: a.attendedAt,
          leaveAt: a.leftAt,
          remark: a.remark ?? '',
          teacherId: a.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[a.teacherId].hashedId) : toTeacherId(serviceDirector.hashedId),
          createdAt: a.createdAt ?? new Date(),
          updatedAt: a.updatedAt ?? new Date(),
          deletedAt: a.deletedAt,
        }
      }),
      trxs,
    )
  }
}
