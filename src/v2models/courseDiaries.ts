import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface NotificationV2 {
  id: number
  hashedId: string
  teacherId: number
  content: string
  sendMode: string
  smsCount: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const findAllNotifications = async (trxs: Trxs): Promise<NotificationV2[]> => {
  const query = v2db()
    .select()
    .from('notifications')
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
