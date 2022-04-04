import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface ReceiptV2 {
  id: number
  hashedId: string
  studentId: number | null
  number: string | null
  remark: string | null
  paidAt: Date | null
  url: string | null
  teacherId: number | null
  price: number | null
  payType: 'cash' | 'transfer' | 'ticket' | 'handwrite' | 'discount' | 'others' | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllReceipts = async (limit: number, offset: number, trxs: Trxs): Promise<ReceiptV2[]> => {
  const query = v2db()
    .select()
    .from('receipts')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfReceipt = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('receipts')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
