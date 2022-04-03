import {findSiteInfo} from "@/v2models/siteInfo"
import {findAllCourseCategories} from "@/v2models/courseCategories";
import {createCourses} from "@/v3models/courses";
import toCourseId from "@/utils/toCourseId";
import toSchoolId from "@/utils/toSchoolId";
import toCourseType from "@/utils/toCourseType";
import generateUUID from "@/utils/generateUUID";
import {Trxs} from "@/types/Trxs";

export default async (trxs: Trxs) => {
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
