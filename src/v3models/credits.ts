import v3db from "../db/v3db.js"
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js"
import v2db from "../db/v2db.js";

export interface CreditV3 {
  id: string
  schoolId: string
  courseId: string
  studentId: string
  teacherId: string
  clazzId: string | null
  lessonId: string | null
  reason: string
  count: number
  remark: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createCredits = async (credits: CreditV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(credits))
    .from('credits')
    // @ts-ignore
    .onConflict('id')
    .ignore()
    .transacting(trxs.v3db)

  await query
  return
}

export const getNumberOfCredit = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('credits')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
