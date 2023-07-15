import v2chatdb from "../db/v2chatdb.js";
import camelcaseKeys from "camelcase-keys";

export interface MessageV2 {
  id: string
  roomId: string
  userId: string
  message: any
  lastSeenAt: Date
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const findMessagesByRoomId = async (roomId: string): Promise<MessageV2[]> => {
  const query = v2chatdb()
    .select()
    .from('messages')
    .where({
      room_id: roomId
    })
    .whereNull("deleted_at")

  return camelcaseKeys(await query);
}
