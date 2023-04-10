import snakecaseKeys from "snakecase-keys"
import v3chatdb from "@/db/v3chatdb"
import {Trxs} from "@/types/Trxs";

export interface MessageV3 {
  id: string
  roomId: string
  type: 'text' | 'image' | 'info' | 'file'
  payload: object
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string
  deletedAt: Date | null
}

export const createMessages = async (messages: MessageV3[], trxs: Trxs): Promise<void> => {
  const query = v3chatdb()
    .insert(snakecaseKeys(messages))
    .from('messages')
    .transacting(trxs.v3chatdb)

  await query
  return
}
