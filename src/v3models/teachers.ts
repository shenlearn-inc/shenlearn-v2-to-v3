import v3db from "@/db/v3db";
import snakecaseKeys from "snakecase-keys";
import {Trxs} from "@/types/Trxs";
import camelcaseKeys from "camelcase-keys";

export interface TeacherV3 {
  id: string
  username: string
  password: string
  salt: string
  accessToken: string | null
  refreshToken: string | null
  schoolId: string
  roleId: string
  name: string
  no: string
  avatarUrl: string | null
  status: 'pending' | 'active' | 'inactive'
  cardNo: string | null
  cellphonePrefix: string | null
  cellphone: string | null
  telephonePrefix: string | null
  telephone: string | null
  email: string | null
  address: string
  isSms: boolean
  isEmail: boolean
  remark: string
  isInSchool: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createTeachers = async (teachers: TeacherV3[], trxs: Trxs): Promise<TeacherV3[]> => {
  const query = v3db()
    .insert(snakecaseKeys(teachers))
    .from('teachers')
    .returning('*')
    .transacting(trxs.v3db)

  return camelcaseKeys(await query)
}
