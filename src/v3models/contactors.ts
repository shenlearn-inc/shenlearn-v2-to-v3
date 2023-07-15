import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ContactorV3 {
  id: string
  username: string
  password: string | null
  salt: string | null
  accessToken: string | null
  refreshToken: string | null
  roleId: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createContactors = async (contactors: ContactorV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(contactors))
    .from('contactors')
    // @ts-ignore
    .onConflict('id')
    .ignore()
    .transacting(trxs.v3db)

  await query
  return
}
