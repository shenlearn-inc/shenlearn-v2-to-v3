import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ReceiptV3 {
  id: string
  schoolId: string
  studentId: string
  teacherId: string
  number: string
  payType: 'cash' | 'transfer' | 'ticket' | 'handwrite' | 'discount' | 'others'
  totalPrice: number
  remark: string | null
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  url: string
  paymentConfigId: string | null
  schoolName: string | null
  schoolImageUrl: string | null
  schoolCertificateNumber: string | null
  schoolTelephonePrefix: string | null
  schoolTelephone: string | null
  schoolAddress: string | null
}

export const createReceipts = async (receipts: ReceiptV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(receipts))
    .from('receipts')
    .transacting(trxs.v3db)

  await query
  return
}
