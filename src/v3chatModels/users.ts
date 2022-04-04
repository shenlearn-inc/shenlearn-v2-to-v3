import snakecaseKeys from "snakecase-keys"
import v3chatdb from "@/db/v3chatdb"
import {Trxs} from "@/types/Trxs";

export interface UserV3 {
  id: string
  name: string
  type: 'student' | 'teacher' | 'contactor' | 'admin' | 'school' | 'unknown'
  avatarUrl: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createUsers = async (users: UserV3[], trxs: Trxs): Promise<void> => {
  const query = v3chatdb()
    .insert(snakecaseKeys(users))
    .from('users')
    // @ts-ignore
    .onConflict('id')
    .ignore()
    .transacting(trxs.v3chatdb)

  await query
  return
}
