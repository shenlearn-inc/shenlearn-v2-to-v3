import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface SubContactorV3 {
  id: string
  contactorId: string
  schoolId: string
  studentId: string
  name: string
  relationship: 'father' | 'mother' | 'grandfather' | 'grandmother' | 'aunt' | 'uncle' | 'me' | 'others'
  cellphonePrefix: string
  cellphone: string
  isSms: boolean
  chatRoomId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createSubContactors = async (subContactorV3s: SubContactorV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(subContactorV3s))
    .from('sub_contactors')
    .transacting(trxs.v3db)

  await query
  return
}
