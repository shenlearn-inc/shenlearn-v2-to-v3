import v2db from "../db/v2db.js";
import camelcaseKeys from "camelcase-keys";
import {Trxs} from "../types/Trxs.js";

export interface TeacherV2 {
  id: number
  name: string | null
  aftsId: string | null
  cardId: string | null
  hashedId: string
  email: string | null
  password: string | null
  telephoneInternationalPrefix: string | null
  telephone: string | null
  cellphoneInternationalPrefix: string | null
  cellphone: string | null
  address: string | null
  remark: string | null
  status: number
  inclass: number
  isSms: number
  isEmail: number
  position: 'teacher' | 'manager' | 'director' | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllTeachers = async (limit: number, offset: number, trxs: Trxs): Promise<TeacherV2[]> => {
  const query = v2db()
    .select()
    .from('teachers')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfTeacher = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('teachers')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}

export const findTeacherById = async (teacherId: number, trxs: Trxs): Promise<TeacherV2> => {
  const query = v2db()
    .first()
    .from('teachers')
    .where('id', teacherId)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const findTeachersByIds = async (teacherIds: number[], trxs: Trxs): Promise<TeacherV2[]> => {
  const query = v2db()
    .select()
    .from('teachers')
    .whereIn('id', teacherIds)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const findServiceTeacher = async (trxs: Trxs): Promise<TeacherV2> => {
  const query = v2db()
    .first()
    .from('teachers')
    .where('email', "service@shenlearn.com")
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
