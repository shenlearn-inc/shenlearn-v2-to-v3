import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findTeachersByIds, TeacherV2} from "@/v2models/teachers";
import config from "@/config";
import {findAllStudentSchedules, getNumberOfStudentSchedule} from "@/v2models/studentSchedules";
import {createStudentSchedules} from "@/v3models/studentSchedules";
import generateUUID from "@/utils/generateUUID";
import toStudentScheduleHashedId from "@/utils/toStudentScheduleHashedId";
import {findStudentsByIds, StudentV2} from "@/v2models/students";
import _, {keyBy} from "lodash";
import toStudentId from "@/utils/toStudentId";
import {CourseV2, findCoursesByIds} from "@/v2models/courses";
import toClazzId from "@/utils/toClazzId";
import toStudentScheduleType from "@/utils/toStudentScheduleType";
import toTeacherId from "@/utils/toTeacherId";

export default async (trxs: Trxs) => {
  console.info('轉移請假')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  const numberOfPayment = await getNumberOfStudentSchedule(trxs)
  for (let i = 0; i < Math.ceil(numberOfPayment / config.chunkSize); i++) {

    // 找出學生排程
    const v2StudentSchedules = await findAllStudentSchedules(config.chunkSize, i * config.chunkSize, trxs)

    const v2Students = await findStudentsByIds(Array.from(new Set(v2StudentSchedules.map(pi => pi.studentId))), trxs) as StudentV2[]
    const v2StudentMap = keyBy(v2Students, 'id')

    const v2Courses = await findCoursesByIds(Array.from(new Set(v2StudentSchedules.map(a => a.courseId))), trxs) as CourseV2[]
    const v2CourseMap = _.keyBy(v2Courses, 'id')

    const v2Teachers = await findTeachersByIds(Array.from(new Set(v2StudentSchedules.map(a => a.teacherId))), trxs) as TeacherV2[]
    const v2TeacherMap = _.keyBy(v2Teachers, 'id')

    await createStudentSchedules(
      v2StudentSchedules.map(s => {
        const studentId  = toStudentId(v2StudentMap[s.studentId].hashedId)
        const clazzId = toClazzId(v2CourseMap[s.courseId].hashedId)
        const type = toStudentScheduleType(s.event)
        return {
          id: generateUUID(s.hashedId),
          schoolId: schoolId,
          hashedId: toStudentScheduleHashedId(studentId, clazzId, type, s.handleAt.toISOString().slice(0, 10)),
          studentId,
          clazzId,
          type,
          date: s.handleAt.toISOString().slice(0, 10),
          remark: '',
          createdBy: toTeacherId(v2TeacherMap[s.teacherId].hashedId),
          createdAt: s.createdAt ?? new Date(),
          updatedAt: s.updatedAt ?? new Date(),
          deletedAt: s.deletedAt,
        }
      }),
      trxs,
    )
  }
}
