import snakecaseKeys from "snakecase-keys"
import v3chatdb from "@/db/v3chatdb"
import {Trxs} from "@/types/Trxs";
import {chunk} from "lodash"

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
  for (const c of chunk(refs, 100)) {
    await v3chatdb()
      .insert(snakecaseKeys(c))
      .from('room_user_refs')
      .transacting(trxs.v3chatdb)
  }
  return
}
