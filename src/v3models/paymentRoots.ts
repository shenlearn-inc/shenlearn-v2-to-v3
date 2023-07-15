import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface PaymentRootV3 {
  id: string
  schoolId: string
  name: string
  cycleDay: number
  isOnline: boolean
  remark: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createPaymentRoots = async (paymentRoots: PaymentRootV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(paymentRoots))
    .from('payment_roots')
    .transacting(trxs.v3db)

  await query
  return
}
