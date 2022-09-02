import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface CreditV2 {
  id: number
  hashedId: string
  courseCategoryId: number | null
  courseId: number | null
  inclassCourseId: number | null
  studentId: number
  teacherId: number
  remark: string | null
  count: number
  reason: string | null
  handleTeacherId: number | null
  receiptNumber: string | null
  receiptDate: string | null
  receiptItem: string | null
  receiptOld: string | null
  discount: string | null
  inclassPerWeekCount: number
  shouldPay: number
  actualPay: number
  lostPay: number
  payType: string | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllCredits = async (limit: number, offset: number, trxs: Trxs): Promise<CreditV2[]> => {
  const query = v2db()
    .select()
    .from('credits')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfCredit = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('credits')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
