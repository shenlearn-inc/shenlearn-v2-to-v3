import {Trxs} from "../types/Trxs.js";
import {findAllInclassCourses, getNumberOfInclassCourse} from "../v2models/inclassCourses.js";
import config from "../config/index.js";
import {createLessons} from "../v3models/lessons.js";
import generateUUID from "../utils/generateUUID.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toSchoolId from "../utils/toSchoolId.js";
import {findCoursesByIds} from "../v2models/courses.js";
import _ from "lodash"
import toClazzId from "../utils/toClazzId.js";
import {findTeachersByIds} from "../v2models/teachers.js";
import toTeacherId from "../utils/toTeacherId.js";
import v2db from "../db/v2db.js";
import toValidDateObj from "../utils/toValidDateObj.js";
import v3db from "../db/v3db.js";
import {Site} from "../types/Site.js";
import {TeacherV3} from "../v3models/teachers.js";

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移課堂資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  const numberOfInclassCourse = await getNumberOfInclassCourse(trxs)
  for (let i = 0; i < Math.ceil(numberOfInclassCourse / config.chunkSize); i++) {

    // 找出課堂
    const inclassCourses = await findAllInclassCourses(config.chunkSize, i * config.chunkSize, trxs)

    const v2Courses = await findCoursesByIds(inclassCourses.map(c => c.courseId), trxs)
    const v2CourseMap = _.keyBy(v2Courses, 'id')

    const v2Teachers = await findTeachersByIds(inclassCourses.map(c => c.teacherId), trxs)
    const v2TeacherMap = _.keyBy(v2Teachers, 'id')

    if (site?.isHandleDuplicateHashedId) {
      for (let i = 0; i < inclassCourses.length; i++) {
        const c = inclassCourses[i];
        if (!(c.courseId in v2CourseMap)) {
          continue;
        }
        const isExisted = await v3db().first().from("lessons").where("id", generateUUID(c.hashedId)).transacting(trxs.v3db)
        if (isExisted) {
          // 產出新 hashedId
          const newHashedId = c.hashedId + "00000";
          await v2db().from("inclass_courses").update({hashed_id: newHashedId}).where({id: c.id}).transacting(trxs.v2db)
          inclassCourses[i].hashedId = newHashedId
        }
        await createLessons(
          [
            {
              id: generateUUID(inclassCourses[i].hashedId),
              schoolId: toSchoolId(siteInfoV2.hashedId),
              clazzId: toClazzId(v2CourseMap[c.courseId].hashedId),
              name: '',
              startAt: toValidDateObj(c.inclassAt) ?? null,
              endAt: toValidDateObj(c.outclassAt) ?? null,
              teacherId: c.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[c.teacherId].hashedId) : serviceDirector.id,
              createdAt: toValidDateObj(c.createdAt) ?? new Date(),
              updatedAt: toValidDateObj(c.updatedAt) ?? new Date(),
              deletedAt: toValidDateObj(c.deletedAt),
            }
          ],
          trxs,
        )
      }
    } else {
      // 轉移課堂
      await createLessons(
        inclassCourses.filter((c) => c.courseId in v2CourseMap).map(c => {
          return {
            id: generateUUID(c.hashedId),
            schoolId: toSchoolId(siteInfoV2.hashedId),
            clazzId: toClazzId(v2CourseMap[c.courseId].hashedId),
            name: '',
            startAt: toValidDateObj(c.inclassAt) ?? null,
            endAt: toValidDateObj(c.outclassAt) ?? null,
            teacherId: c.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[c.teacherId].hashedId) : serviceDirector.id,
            createdAt: toValidDateObj(c.createdAt) ?? new Date(),
            updatedAt: toValidDateObj(c.updatedAt) ?? new Date(),
            deletedAt: toValidDateObj(c.deletedAt),
          }
        }),
        trxs,
      )
    }
  }
}
