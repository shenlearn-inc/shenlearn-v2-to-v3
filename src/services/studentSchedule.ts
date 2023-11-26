import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toSchoolId from "../utils/toSchoolId.js";
import {findTeachersByIds, TeacherV2} from "../v2models/teachers.js";
import config from "../config/index.js";
import {findAllStudentSchedules, getNumberOfStudentSchedule} from "../v2models/studentSchedules.js";
import {createStudentSchedules} from "../v3models/studentSchedules.js";
import generateUUID from "../utils/generateUUID.js";
import toStudentScheduleHashedId from "../utils/toStudentScheduleHashedId.js";
import {findStudentsByIds, StudentV2} from "../v2models/students.js";
import _ from "lodash";
import toStudentId from "../utils/toStudentId.js";
import {CourseV2, findCoursesByIds} from "../v2models/courses.js";
import toClazzId from "../utils/toClazzId.js";
import toStudentScheduleType from "../utils/toStudentScheduleType.js";
import toTeacherId from "../utils/toTeacherId.js";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";

export default async (trxs: Trxs) => {
  console.info('轉移請假')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  const numberOfSchedule = await getNumberOfStudentSchedule(trxs)
  for (let i = 0; i < Math.ceil(numberOfSchedule / config.chunkSize); i++) {

    // 找出學生排程
    const v2StudentSchedules = (await findAllStudentSchedules(config.chunkSize, i * config.chunkSize, trxs)).filter(s => !!s.studentId)

    const v2Students = await findStudentsByIds(Array.from(new Set(v2StudentSchedules.map(pi => pi.studentId))), trxs) as StudentV2[]
    const v2StudentMap = _.keyBy(v2Students, 'id')

    const v2Courses = await findCoursesByIds(Array.from(new Set(v2StudentSchedules.map(a => a.courseId))), trxs) as CourseV2[]
    const v2CourseMap = _.keyBy(v2Courses, 'id')

    const v2Teachers = await findTeachersByIds(Array.from(new Set(v2StudentSchedules.map(a => a.teacherId))), trxs) as TeacherV2[]
    const v2TeacherMap = _.keyBy(v2Teachers, 'id')

    await createStudentSchedules(
      v2StudentSchedules.filter((s) => !!s.handleAt && s.studentId in v2StudentMap && s.courseId in v2CourseMap).map(s => {
        const studentId  = toStudentId(v2StudentMap[s.studentId].hashedId)
        const clazzId = toClazzId(v2CourseMap[s.courseId].hashedId)
        const type = toStudentScheduleType(s.event)
        return {
          id: generateUUID(s.hashedId + "00000"),
          schoolId: schoolId,
          hashedId: toStudentScheduleHashedId(studentId, clazzId, type, s.handleAt.toISOString().slice(0, 10)),
          studentId,
          clazzId,
          type,
          date: s.handleAt.toISOString().slice(0, 10),
          remark: '',
          createdBy: s.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[s.teacherId].hashedId) : serviceDirector.id,
          createdAt: s.createdAt ?? new Date(),
          updatedAt: s.updatedAt ?? new Date(),
          deletedAt: s.deletedAt,
        }
      }),
      trxs,
    )
  }
}
