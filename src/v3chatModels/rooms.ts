import snakecaseKeys from "snakecase-keys"
import v3chatdb from "@/db/v3chatdb"
import {Trxs} from "@/types/Trxs";

export interface RoomV3 {
  id: string
  name: string
  type: 'teachers-to-student' | 'teachers-to-sub-contactor' | 'contactor-to-shenlearn' | 'teacher-to-shenlearn' | 'unknown'
  avatarUrl: string | null
  externalId: string | null
  lastMessage: object | null // 最後一筆訊息
  lastMessageAt: Date | null
  lastChatMessage: object | null // 最後一筆聊天訊息，不包含系統訊息等等
  lastChatMessageAt: Date | null
  deactivatedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createRooms = async (rooms: RoomV3[], trxs: Trxs): Promise<void> => {
  const query = v3chatdb()
    .insert(snakecaseKeys(rooms))
    .from('rooms')
    // @ts-ignore
    .onConflict('id')
    .ignore()
    .transacting(trxs.v3chatdb)

  await query
  return
}
