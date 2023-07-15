import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface PaymentV3 {
  id: string
  schoolId: string
  teacherId: string
  paymentRootId: string
  price: number
  remark: string | null
  isPublic: boolean
  deadlineDate: string | null
  startedDate: string | null
  endedDate: string | null
  courseId: string | null
  creditCount: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createPayments = async (payments: PaymentV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(payments))
    .from('payments')
    .transacting(trxs.v3db)

  await query
  return
}
