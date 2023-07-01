import {Trxs} from "@/types/Trxs";
import {findAllCourseStudentRefs, getNumberOfCourseStudentRef} from "@/v2models/courseStudentRefs";
import config from "@/config";
import {findCoursesByIds} from "@/v2models/courses";
import {findStudentsByIds} from "@/v2models/students";
import {keyBy} from "lodash"
import {createClazzStudentRefs} from "@/v3models/clazzStudentRefs";
import generateUUID from "@/utils/generateUUID";
import toClazzId from "@/utils/toClazzId";
import toTeacherId from "@/utils/toTeacherId";
import toStudentId from "@/utils/toStudentId";
import {findTeachersByIds} from "@/v2models/teachers";
import {findAllCourseTeacherRefs, getNumberOfCourseTeacherRef} from "@/v2models/courseTeacherRefs";
import {createClazzTeacherRefs} from "@/v3models/clazzTeacherRefs";

export default async (trxs: Trxs) => {
  console.info('轉移班級關係')

  // 轉換學生關係
  const numberOfCourseStudentRef = await getNumberOfCourseStudentRef(trxs)
  for (let i = 0; i < Math.ceil(numberOfCourseStudentRef / config.chunkSize); i++) {
    const v2CourseStudentRefs = await findAllCourseStudentRefs(config.chunkSize, i * config.chunkSize, trxs)

    const v2Courses = await findCoursesByIds(Array.from(new Set(v2CourseStudentRefs.map(r => r.courseId))), trxs)
    const v2CourseMap = keyBy(v2Courses, 'id')

    const v2Students = await findStudentsByIds(Array.from(new Set(v2CourseStudentRefs.map(r => r.studentId))), trxs)
    const v2StudentMap = keyBy(v2Students, 'id')

    // 轉換學生關係
    await createClazzStudentRefs(v2CourseStudentRefs
      .filter(r => !!r.courseId && !!r.studentId && r.courseId in v2CourseMap && r.studentId in v2StudentMap)
      .map(r => {
        return {
          id: generateUUID(),
          clazzId: toClazzId(v2CourseMap[r.courseId].hashedId),
          studentId: toStudentId(v2StudentMap[r.studentId].hashedId),
          createdAt: r.createdAt ?? new Date(),
          updatedAt: r.updatedAt ?? new Date(),
          deletedAt: r.deletedAt,
        }
      }), trxs)
  }

  // 轉換老師關係
  const numberOfCourseTeacherRef = await getNumberOfCourseTeacherRef(trxs)
  for (let i = 0; i < Math.ceil(numberOfCourseTeacherRef / config.chunkSize); i++) {
    const v2CourseTeacherRefs = await findAllCourseTeacherRefs(config.chunkSize, i * config.chunkSize, trxs)

    const v2Courses = await findCoursesByIds(Array.from(new Set(v2CourseTeacherRefs.map(r => r.courseId))), trxs)
    const v2CourseMap = keyBy(v2Courses, 'id')

    const v2Teachers = await findTeachersByIds(Array.from(new Set(v2CourseTeacherRefs.map(r => r.teacherId))), trxs)
    const v2TeacherMap = keyBy(v2Teachers, 'id')

    // 轉換老師關係
    await createClazzTeacherRefs(v2CourseTeacherRefs
      .filter(r => {
        if (r.courseId === 114) {
          console.log(r)
        }
        return !!r.courseId && !!r.teacherId && r.teacherId in v2TeacherMap
      })
      .map(r => {

        return {
          id: generateUUID(),
          clazzId: toClazzId(v2CourseMap[r.courseId].hashedId),
          teacherId: toTeacherId(v2TeacherMap[r.teacherId].hashedId),
          createdAt: r.createdAt ?? new Date(),
          updatedAt: r.updatedAt ?? new Date(),
          deletedAt: r.deletedAt,
        }
      }), trxs)
  }
}
