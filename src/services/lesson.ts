import {Trxs} from "@/types/Trxs";
import {findAllInclassCourses, getNumberOfInclassCourse} from "@/v2models/inclassCourses";
import config from "@/config";
import {createLessons} from "@/v3models/lessons";
import generateUUID from "@/utils/generateUUID";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findCoursesByIds} from "@/v2models/courses";
import {keyBy} from "lodash"
import toClazzId from "@/utils/toClazzId";
import {findTeachersByIds, TeacherV2} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import v2db from "@/db/v2db";
import toValidDateObj from "@/utils/toValidDateObj";
import v3db from "@/db/v3db";
import {Site} from "@/types/Site";

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移課堂資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  const serviceDirector = await v2db()
    .first()
    .from('teachers')
    .where('name', 'Service')
    .orWhere('email', 'service@shenlearn.com') as TeacherV2

  const numberOfInclassCourse = await getNumberOfInclassCourse(trxs)
  for (let i = 0; i < Math.ceil(numberOfInclassCourse / config.chunkSize); i++) {

    // 找出課堂
    const inclassCourses = await findAllInclassCourses(config.chunkSize, i * config.chunkSize, trxs)

    const v2Courses = await findCoursesByIds(inclassCourses.map(c => c.courseId), trxs)
    const v2CourseMap = keyBy(v2Courses, 'id')

    const v2Teachers = await findTeachersByIds(inclassCourses.map(c => c.teacherId), trxs)
    const v2TeacherMap = keyBy(v2Teachers, 'id')

    if (site?.isHandleDuplicateHashedId) {
      for (let i = 0; i < inclassCourses.length; i++) {
        const c = inclassCourses[i];
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
              teacherId: c.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[c.teacherId].hashedId) : toTeacherId(serviceDirector.hashedId),
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
        inclassCourses.map(c => {
          return {
            id: generateUUID(c.hashedId),
            schoolId: toSchoolId(siteInfoV2.hashedId),
            clazzId: toClazzId(v2CourseMap[c.courseId].hashedId),
            name: '',
            startAt: toValidDateObj(c.inclassAt) ?? null,
            endAt: toValidDateObj(c.outclassAt) ?? null,
            teacherId: c.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[c.teacherId].hashedId) : toTeacherId(serviceDirector.hashedId),
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
