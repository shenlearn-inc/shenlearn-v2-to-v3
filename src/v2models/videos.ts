import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface VideoV2 {
  id: number
  hashedId: string
  name: string
  remark: string | null
  url: string
  expiredAt: string
  size: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const findAllVideos = async (limit: number, offset: number, trxs: Trxs): Promise<VideoV2[]> => {
  const query = v2db()
    .select()
    .from('videos')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .whereNull('deleted_at')
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
