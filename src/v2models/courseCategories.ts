import v2db from "@/db/v2db";
import camelcaseKeys from "camelcase-keys";
import {Trxs} from "@/types/Trxs";

export interface CourseCategoryV2 {
  id: number
  name: string | null
  hashedId: string
  price: number | null
  currency: 'USD' | 'NTD' | 'RMB' | null
  remark: string | null
  status: number
  courseType: 'unlimited' | 'limited' | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllCourseCategories = async (limit: number, offset: number, trxs: Trxs): Promise<CourseCategoryV2[]> => {
  const query = v2db()
    .select()
    .from('course_categories')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const findCourseCategoriesByIds = async (courseCategoryIds: number[], trxs: Trxs): Promise<CourseCategoryV2[]> => {
  const query = v2db()
    .select()
    .from('course_categories')
    .whereIn('id', courseCategoryIds)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
