import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface PaymentV2 {
  id: number
  hashedId: string
  price: number | null
  name: string | null
  paymentTagName: string | null
  remark: string | null
  deadlineAt: Date | null
  startedAt: Date | null
  endedAt: Date | null
  isPublic: boolean
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllPayments = async (limit: number, offset: number, trxs: Trxs): Promise<PaymentV2[]> => {
  const query = v2db()
    .select()
    .from('payments')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfPayment = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('payments')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
