import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface CourseV2 {
  id: number
  courseCategoryId: number
  name: string | null
  hashedId: string
  remark: string | null
  status: number
  inclass: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllCourses = async (limit: number, offset: number, trxs: Trxs): Promise<CourseV2[]> => {
  const query = v2db()
    .select()
    .from('courses')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const findCoursesByIds = async (courseIds: number[], trxs: Trxs): Promise<CourseV2[]> => {
  const query = v2db()
    .select()
    .from('courses')
    .whereIn('id', courseIds)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
