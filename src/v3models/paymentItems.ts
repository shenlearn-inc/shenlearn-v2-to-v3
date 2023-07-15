import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface PaymentItemV3 {
  id: string
  schoolId: string
  paymentId: string
  studentId: string
  teacherId: string
  name: string
  price: number
  remark: string | null
  isPublic: boolean
  deadlineDate: string | null
  startedDate: string | null
  endedDate: string | null
  receiptId: string | null
  courseId: string | null
  creditCount: number | null
  order: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createPaymentItems = async (payments: PaymentItemV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(payments))
    .from('payment_items')
    .transacting(trxs.v3db)

  await query
  return
}
