import v2db from "@/db/v2db";
import camelcaseKeys from "camelcase-keys";
import {Trxs} from "@/types/Trxs";

export interface StudentParentV2 {
  id: number
  studentId: number | null
  hashedId: string
  name: string | null
  relationship: 'father' | 'mother' | 'grandfather' | 'grandmother' | 'uncle' | 'aunt' | 'others' | 'me' | null
  password: string | null
  cellphoneInternationalPrefix: string | null
  cellphone: string | null
  sms: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findStudentParentsByStudent = async (studentId: number, trxs: Trxs): Promise<StudentParentV2[]> => {
  const query = v2db()
    .select()
    .from('student_parents')
    .where('student_id', studentId)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const findAllStudentParents = async (limit: number, offset: number, trxs: Trxs): Promise<StudentParentV2[]> => {
  const query = v2db()
    .select()
    .from('student_parents')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfStudentParent = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('student_parents')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
