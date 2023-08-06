import {Trxs} from "../types/Trxs.js";
import {findAllCourseStudentRefs, getNumberOfCourseStudentRef} from "../v2models/courseStudentRefs.js";
import config from "../config/index.js";
import {findCoursesByIds} from "../v2models/courses.js";
import {findStudentsByIds} from "../v2models/students.js";
import _ from "lodash"
import {createClazzStudentRefs} from "../v3models/clazzStudentRefs.js";
import generateUUID from "../utils/generateUUID.js";
import toClazzId from "../utils/toClazzId.js";
import toTeacherId from "../utils/toTeacherId.js";
import toStudentId from "../utils/toStudentId.js";
import {findTeachersByIds} from "../v2models/teachers.js";
import {findAllCourseTeacherRefs} from "../v2models/courseTeacherRefs.js";
import {createClazzTeacherRefs} from "../v3models/clazzTeacherRefs.js";
import toValidDateObj from "../utils/toValidDateObj.js";

export default async (trxs: Trxs) => {
  console.info('轉移班級關係')

  // 轉換學生關係
  const numberOfCourseStudentRef = await getNumberOfCourseStudentRef(trxs)
  for (let i = 0; i < Math.ceil(numberOfCourseStudentRef / config.chunkSize); i++) {
    const v2CourseStudentRefs = await findAllCourseStudentRefs(config.chunkSize, i * config.chunkSize, trxs)

    const v2Courses = await findCoursesByIds(Array.from(new Set(v2CourseStudentRefs.map(r => r.courseId))), trxs)
    const v2CourseMap = _.keyBy(v2Courses, 'id')

    const v2Students = await findStudentsByIds(Array.from(new Set(v2CourseStudentRefs.map(r => r.studentId))), trxs)
    const v2StudentMap = _.keyBy(v2Students, 'id')

    // 轉換學生關係
    await createClazzStudentRefs(v2CourseStudentRefs
      .filter(r => !!r.courseId && !!r.studentId && r.courseId in v2CourseMap && r.studentId in v2StudentMap)
      .map(r => {
        return {
          id: generateUUID(),
          clazzId: toClazzId(v2CourseMap[r.courseId].hashedId),
          studentId: toStudentId(v2StudentMap[r.studentId].hashedId),
          createdAt: toValidDateObj(r.createdAt) ?? new Date(),
          updatedAt: toValidDateObj(r.updatedAt) ?? new Date(),
          deletedAt: toValidDateObj(r.deletedAt),
        }
      }), trxs)
  }

  // 轉換老師關係
  const v2CourseTeacherRefs = await findAllCourseTeacherRefs(trxs)

  const v2Courses = await findCoursesByIds(Array.from(new Set(v2CourseTeacherRefs.map(r => r.courseId))), trxs)
  const v2CourseMap = _.keyBy(v2Courses, 'id')

  const v2Teachers = await findTeachersByIds(Array.from(new Set(v2CourseTeacherRefs.map(r => r.teacherId))), trxs)
  const v2TeacherMap = _.keyBy(v2Teachers, 'id')

  // 轉換老師關係
  await createClazzTeacherRefs(v2CourseTeacherRefs
    .filter(r => {
      const condition = !!r.courseId && !!r.teacherId && r.teacherId in v2TeacherMap && r.courseId in v2CourseMap;
      if (!condition) {
        console.log({
          id: r.id,
          courseId: r.courseId,
          teacherId: r.teacherId,
        })
        return false
      }
      return true
    })
    .map(r => {

      return {
        id: generateUUID(),
        clazzId: toClazzId(v2CourseMap[r.courseId].hashedId),
        teacherId: toTeacherId(v2TeacherMap[r.teacherId].hashedId),
        createdAt: toValidDateObj(r.createdAt) ?? new Date(),
        updatedAt: toValidDateObj(r.updatedAt) ?? new Date(),
        deletedAt: toValidDateObj(r.deletedAt),
      }
    }), trxs)
}
