import v3db from "@/db/v3db"
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "@/types/Trxs"

export interface CreditV3 {
  id: string
  schoolId: string
  courseId: string
  studentId: string
  teacherId: string
  clazzId: string | null
  lessonId: string | null
  receiptId: string | null
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
    .from('clazzes')
    .transacting(trxs.v3db)

  await query
  return
}
