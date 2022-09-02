import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findTeachersByIds, TeacherV2} from "@/v2models/teachers";
import config from "@/config";
import {getNumberOfStudentSchedule} from "@/v2models/studentSchedules";
import {findStudentsByIds, StudentV2} from "@/v2models/students";
import _, {keyBy} from "lodash";
import toStudentId from "@/utils/toStudentId";
import {CourseV2, findCoursesByIds} from "@/v2models/courses";
import toClazzId from "@/utils/toClazzId";
import toTeacherId from "@/utils/toTeacherId";
import {findAllCredits} from "@/v2models/credits";
import {CourseCategoryV2, findCourseCategoriesByIds} from "@/v2models/courseCategories";
import {findInclassCoursesByIds, InclassCourseV2} from "@/v2models/inclassCourses";
import {createCredits} from "@/v3models/credits";
import toCourseId from "@/utils/toCourseId";
import toLessonId from "@/utils/toLessonId";
import toCreditId from "@/utils/toCreditId";

export default async (trxs: Trxs) => {
  console.info('轉移堂次')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  const numberOfPayment = await getNumberOfStudentSchedule(trxs)
  for (let i = 0; i < Math.ceil(numberOfPayment / config.chunkSize); i++) {

    // 找出堂次
    const v2Credits = await findAllCredits(config.chunkSize, i * config.chunkSize, trxs)

    const v2Students = await findStudentsByIds(Array.from(new Set(v2Credits.map(pi => pi.studentId))), trxs) as StudentV2[]
    const v2StudentMap = keyBy(v2Students, 'id')

    const v2Courses = await findCoursesByIds(Array.from(new Set(v2Credits.filter(a => !!a.courseId).map(a => a.courseId) as number[])), trxs) as CourseV2[]
    const v2CourseMap = _.keyBy(v2Courses, 'id')

    const v2CourseCategories = await findCourseCategoriesByIds(Array.from(new Set(v2Credits.filter(a => !!a.courseCategoryId).map(a => a.courseCategoryId) as number[])), trxs) as CourseCategoryV2[]
    const v2CourseCategoryMap = _.keyBy(v2CourseCategories, 'id')

    const v2Teachers = await findTeachersByIds(Array.from(new Set(v2Credits.map(a => a.teacherId))), trxs) as TeacherV2[]
    const v2TeacherMap = _.keyBy(v2Teachers, 'id')

    const v2InclassCourses = await findInclassCoursesByIds(Array.from(new Set(v2Credits.filter(a => !!a.inclassCourseId).map(a => a.inclassCourseId) as number[])), trxs) as InclassCourseV2[]
    const v2InclassCourseMap = _.keyBy(v2InclassCourses, 'id')

    // 檢查 courseCategoryId 是否為 null
    v2Credits.forEach(c => {
      if (!c.courseCategoryId) throw new Error(`轉移堂次 id: ${c.id} 發生錯誤，課種id 為 null`)
    })

    await createCredits(
      v2Credits.map(c => {
        const id = toCreditId(c.hashedId)
        const courseId = toCourseId(v2CourseCategoryMap[c.courseCategoryId as number].hashedId)
        const studentId = toStudentId(v2StudentMap[c.studentId].hashedId)
        const teacherId = toTeacherId(v2TeacherMap[c.teacherId].hashedId)
        const clazzId = c.courseId ? toClazzId(v2CourseMap[c.courseId].hashedId) : null
        const lessonId = c.inclassCourseId ? toLessonId(v2InclassCourseMap[c.inclassCourseId].hashedId) : null
        const receiptId = null

        return {
          id,
          schoolId,
          courseId,
          studentId,
          teacherId,
          clazzId,
          lessonId,
          receiptId,
          reason: c.reason ?? '',
          count: c.count ?? 0,
          remark: c.remark ?? '',
          createdAt: c.createdAt ?? new Date(),
          updatedAt: c.updatedAt ?? new Date(),
          deletedAt: c.deletedAt,
        }
      }),
      trxs,
    )
  }
}
