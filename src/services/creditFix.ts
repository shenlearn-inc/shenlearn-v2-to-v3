import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import v3db from "../db/v3db.js";
import toSchoolId from "../utils/toSchoolId.js";
import {TeacherV3} from "../v3models/teachers.js";
import _ from "lodash";
import {createCredits, getNumberOfCredit} from "../v3models/credits.js";
import config from "../config/index.js";
import {findAllCredits} from "../v2models/credits.js";
import {findStudentsByIds, StudentV2} from "../v2models/students.js";
import {CourseV2, findCoursesByIds} from "../v2models/courses.js";
import {CourseCategoryV2, findCourseCategoriesByIds} from "../v2models/courseCategories.js";
import {findTeachersByIds, TeacherV2} from "../v2models/teachers.js";
import {findInclassCoursesByIds, InclassCourseV2} from "../v2models/inclassCourses.js";
import toCreditId from "../utils/toCreditId.js";
import toCourseId from "../utils/toCourseId.js";
import toStudentId from "../utils/toStudentId.js";
import toTeacherId from "../utils/toTeacherId.js";
import toClazzId from "../utils/toClazzId.js";
import toLessonId from "../utils/toLessonId.js";
import toValidDateObj from "../utils/toValidDateObj.js";

export default async (trxs: Trxs) => {
  // 主因是原本有篩除掉 courseId == null 的 credit, 但不該篩掉，因為購買堂次也沒有 courseId
  console.info('修補堂次問題')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', schoolId)
    .transacting(trxs.v3db) as TeacherV3

  const chunkSize = Number.MAX_SAFE_INTEGER;
  const numberOfCredit = await getNumberOfCredit(trxs)
  try {
    for (let i = 0; i < Math.ceil(numberOfCredit / chunkSize); i++) {

      // 找出堂次
      const v2Credits = await findAllCredits(chunkSize, i * chunkSize, trxs)

      const v2StudentIds = Array.from(new Set(v2Credits.map(pi => pi.studentId)))
      const v2Students = await findStudentsByIds(v2StudentIds, trxs) as StudentV2[]
      const v2StudentMap = _.keyBy(v2Students, 'id')

      // 如果堂次沒有課種，找出堂次的班級去找課種
      const v2Courses = await findCoursesByIds(Array.from(new Set(v2Credits.filter(a => !!a.courseId).map(a => a.courseId) as number[])), trxs) as CourseV2[]
      const v2CourseMap = _.keyBy(v2Courses, 'id')

      const v2CourseCategories = await findCourseCategoriesByIds(Array.from(new Set(v2Credits.filter(a => !!a.courseCategoryId).map(a => a.courseCategoryId) as number[])), trxs) as CourseCategoryV2[]
      const v2CourseCategoryMap = _.keyBy(v2CourseCategories, 'id')

      const v2Teachers = await findTeachersByIds(Array.from(new Set(v2Credits.map(a => a.teacherId))), trxs) as TeacherV2[]
      const v2TeacherMap = _.keyBy(v2Teachers, 'id')

      const v2InclassCourses = await findInclassCoursesByIds(Array.from(new Set(v2Credits.filter(a => !!a.inclassCourseId).map(a => a.inclassCourseId) as number[])), trxs) as InclassCourseV2[]
      const v2InclassCourseMap = _.keyBy(v2InclassCourses, 'id')

      const v3existCredits = await v3db().select('id').from('credits').where('school_id', schoolId);
      const v3existCreditMap = _.keyBy(v3existCredits, 'id');

      // 檢查 courseCategoryId 是否為 null
      const v3credits = v2Credits.filter(c => !(toCreditId(c.hashedId) in v3existCreditMap) && c.courseCategoryId as number in v2CourseCategoryMap && c.studentId in v2StudentMap).map(c => {
        const id = toCreditId(c.hashedId)
        // @ts-ignore
        const courseId = toCourseId(v2CourseCategoryMap[c.courseCategoryId as number].hashedId)
        const studentId = toStudentId(v2StudentMap[c.studentId].hashedId)
        const teacherId = c.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[c.teacherId].hashedId) : serviceDirector.id
        const clazzId = c.courseId && c.courseId in v2CourseMap ? toClazzId(v2CourseMap[c.courseId].hashedId) : null
        const lessonId = c.inclassCourseId && c.inclassCourseId in v2InclassCourseMap ? toLessonId(v2InclassCourseMap[c.inclassCourseId].hashedId) : null

        return {
          id,
          schoolId,
          courseId,
          studentId,
          teacherId,
          clazzId,
          lessonId,
          reason: c.reason ?? '',
          count: c.count ?? 0,
          remark: c.remark ?? '',
          createdAt: toValidDateObj(c.createdAt) ?? new Date(),
          updatedAt: toValidDateObj(c.updatedAt) ?? new Date(),
          deletedAt: toValidDateObj(c.deletedAt),
        }
      })

      await createCredits(
        v3credits,
        trxs,
      )
      console.log(`已修正 ${v3credits.length} 個堂次紀錄`)
    }
  } catch (e) {
    console.log('something error', {
      message: e.message,
      stack: e.stack,
    })
  }
}
