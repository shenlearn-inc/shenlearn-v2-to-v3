import {findSiteInfo} from "@/v2models/siteInfo"
import {findAllCourseCategories} from "@/v2models/courseCategories";
import {createCourses} from "@/v3models/courses";
import toCourseId from "@/utils/toCourseId";
import toSchoolId from "@/utils/toSchoolId";
import toCourseType from "@/utils/toCourseType";
import generateUUID from "@/utils/generateUUID";
import {Trxs} from "@/types/Trxs";
import config from "@/config";
import v3db from "@/db/v3db";
import v2db from "@/db/v2db";

export default async (trxs: Trxs) => {
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

  if (config.isHandleDuplicateHashedId) {
    for (let i = 0; i < v2CourseCategories.length; i++) {
      const c = v2CourseCategories[i];
      const isExisted = await v3db().first().from("courses").where("id", toCourseId(c.hashedId)).transacting(trxs.v3db)
      if (isExisted) {
        // 產出新 hashedId
        const newHashedId = c.hashedId + "00000";
        await v2db().from("course_categories").update({ hashed_id: newHashedId }).where({ id: c.id }).transacting(trxs.v2db)
        v2CourseCategories[i].hashedId = newHashedId
      }
      await createCourses([
        {
          id: toCourseId(v2CourseCategories[i].hashedId),
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
