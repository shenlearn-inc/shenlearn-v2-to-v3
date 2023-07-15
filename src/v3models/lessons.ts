import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface LessonV3 {
  id: string
  schoolId: string
  clazzId: string
  name: string
  startAt: Date | null
  endAt: Date | null
  teacherId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createLessons = async (lessons: LessonV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(lessons))
    .from('lessons')
    .transacting(trxs.v3db)

  await query
  return
}
