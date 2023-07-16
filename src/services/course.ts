import {findSiteInfo} from "../v2models/siteInfo.js"
import {findAllCourseCategories} from "../v2models/courseCategories.js";
import {createCourses} from "../v3models/courses.js";
import toCourseId from "../utils/toCourseId.js";
import toSchoolId from "../utils/toSchoolId.js";
import toCourseType from "../utils/toCourseType.js";
import generateUUID from "../utils/generateUUID.js";
import {Trxs} from "../types/Trxs.js";
import v3db from "../db/v3db.js";
import v2db from "../db/v2db.js";
import {Site} from "../types/Site.js";

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移課種資料')

  const siteInfoV2 = await findSiteInfo(trxs)

  // 建立初始課種
  await createCourses([{
    id: generateUUID(),
    schoolId: toSchoolId(siteInfoV2.hashedId),
    name: 'INIT',
    remark: '',
    type: 'init',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  }], trxs)

  // 轉換課種
  const v2CourseCategories = await findAllCourseCategories(99999, 0, trxs)
  if (!v2CourseCategories.length) return

  if (site?.isHandleDuplicateHashedId) {
    for (let i = 0; i < v2CourseCategories.length; i++) {

      let isExisted = false;
      const c = v2CourseCategories[i];
      let courseCategoryHashedId = c.hashedId;
      do {
        isExisted = await v3db().first().from("courses").where("id", toCourseId(courseCategoryHashedId)).transacting(trxs.v3db);
        if (isExisted) {
          // 產出新 hashedId
          courseCategoryHashedId = courseCategoryHashedId + "00000";
        }
      } while (isExisted);
      await v2db().from("course_categories").update({ hashed_id: courseCategoryHashedId }).where({ id: c.id }).transacting(trxs.v2db)
      v2CourseCategories[i].hashedId = courseCategoryHashedId
      await createCourses([
        {
          id: toCourseId(courseCategoryHashedId),
          schoolId: toSchoolId(siteInfoV2.hashedId),
          name: c.name ?? '',
          remark: c.remark ?? '',
          type: toCourseType(c.courseType),
          createdAt: c.createdAt ?? new Date(),
          updatedAt: c.updatedAt ?? new Date(),
          deletedAt: c.deletedAt,
        }
      ], trxs)
    }
  } else {
    await createCourses(v2CourseCategories.map(c => {
      return {
        id: toCourseId(c.hashedId),
        schoolId: toSchoolId(siteInfoV2.hashedId),
        name: c.name ?? '',
        remark: c.remark ?? '',
        type: toCourseType(c.courseType),
        createdAt: c.createdAt ?? new Date(),
        updatedAt: c.updatedAt ?? new Date(),
        deletedAt: c.deletedAt,
      }
    }), trxs)
  }
}
