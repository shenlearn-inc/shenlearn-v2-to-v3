import v3db from "@/db/v3db"
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "@/types/Trxs";

export interface SchoolV3 {
  id: string
  organizationId: string
  planId: string
  name: string
  imageUrl: string | null
  domain: string
  description: string
  zone: string
  isActive: boolean
  expiredDate: string
  certificateNumber: string | null
  telephonePrefix: string | null
  telephone: string | null
  address: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createSchool = async (school: SchoolV3, trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(school))
    .from('schools')
    .transacting(trxs.v3db)

  await query
  return
}
