import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface InclassCourseV2 {
  id: number
  hashedId: string
  courseId: number
  teacherId: number
  inclassAt: Date | null
  outclassAt: Date | null
  initialCount: number | null
  actualCount: number | null
  absentCount: number | null
  makeupCount: number | null
  substituteCount: number | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllInclassCourses = async (limit: number, offset: number, trxs: Trxs): Promise<InclassCourseV2[]> => {
  const query = v2db()
    .select()
    .from('inclass_courses')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfInclassCourse = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('inclass_courses')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
