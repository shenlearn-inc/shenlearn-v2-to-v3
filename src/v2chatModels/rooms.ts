import snakecaseKeys from "snakecase-keys"
import v3chatdb from "@/db/v3chatdb"
import {Trxs} from "@/types/Trxs";
import v2chatdb from "@/db/v2chatdb";
import camelcaseKeys from "camelcase-keys";

export interface RoomV2 {
  id: string
  externalService: string
  externalId: string | null
  imageUrl: string | null
  schoolId: string | null;
  lastMessageAt: string | null
  lastMessage: {
    type: string
    payload: any
  } | null
  realLastMessageAt: string | null
  realLastMessage: {
    type: string
    payload: any
  } | null
  createdAt: string | null
  updatedAt: string | null
  deletedAt: string
}

export const findRoomByExternalId = async (externalId: string): Promise<RoomV2 | undefined> => {
  const query = v2chatdb()
    .first()
    .where({
      external_id: externalId
    })
    .from('rooms')

  return camelcaseKeys(await query);
}
