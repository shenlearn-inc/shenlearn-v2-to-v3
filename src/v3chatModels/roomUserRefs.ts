import snakecaseKeys from "snakecase-keys"
import v3chatdb from "@/db/v3chatdb"
import {Trxs} from "@/types/Trxs";

export interface RoomUserRefV3 {
  id: string
  roomId: string
  roomName: string
  roomSubName: string
  roomAvatarUrl: string | null
  userId: string
  userName: string
  userAvatarUrl: string | null
  unread: number
  lastSeenAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createRoomUserRefs = async (refs: RoomUserRefV3[], trxs: Trxs): Promise<void> => {
  const query = v3chatdb()
    .insert(snakecaseKeys(refs))
    .from('room_user_refs')
    .transacting(trxs.v3chatdb)

  await query
  return
}
