import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ClazzV3 {
  id: string
  name: string
  schoolId: string
  courseId: string | null
  attendMethod: 'auto' | 'manual'
  remark: string
  isActive: boolean
  isStarted: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createClazzes = async (clazzes: ClazzV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(clazzes))
    .from('clazzes')
    .transacting(trxs.v3db)

  await query
  return
}
