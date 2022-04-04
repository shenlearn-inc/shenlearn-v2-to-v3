import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface PaymentItemV2 {
  id: number
  hashedId: string
  paymentId: number
  studentId: number
  teacherId: number | null
  price: number | null
  remark: string | null
  deadlineAt: string | null
  startedAt: string | null
  endedAt: string | null
  paidAt: string | null
  isPublic: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllPaymentItems = async (limit: number, offset: number, trxs: Trxs): Promise<PaymentItemV2[]> => {
  const query = v2db()
    .select()
    .from('payment_items')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfPaymentItem = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('payment_items')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
