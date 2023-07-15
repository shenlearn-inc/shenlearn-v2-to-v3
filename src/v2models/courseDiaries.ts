import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface CourseDiaryV2 {
  id: number
  hashedId: string
  courseId: number
  teacherId: number
  title: string
  content: string
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const findAllCourseDiaries = async (trxs: Trxs): Promise<CourseDiaryV2[]> => {
  const query = v2db()
    .select()
    .from('course_diaries')
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
