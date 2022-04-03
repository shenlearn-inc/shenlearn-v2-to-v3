import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs"

export interface CourseTimeV2 {
  id: number
  courseId: number
  hashedId: string
  weekday: string
  startedAt: string
  endedAt: string
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllCourseTimes = async (limit: number, offset: number, trxs: Trxs): Promise<CourseTimeV2[]> => {
  const query = v2db()
    .select()
    .from('course_times')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
