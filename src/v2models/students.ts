import v2db from "../db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface StudentV2 {
  id: number
  teacherId: number | null
  name: string | null
  aftsId: string
  cardId: string | null
  hashedId: string
  gender: 'male' | 'female' | null
  email: string | null
  password: string | null
  telephoneInternationalPrefix: string | null
  telephone: string | null
  cellphoneInternationalPrefix: string | null
  cellphone: string | null
  address: string | null
  birthday: Date | null
  schoolName: string | null
  grade: 'other' | 'first' | 'second' | 'third' | 'fourth' | 'fifth' | 'sixth' | 'seventh' | 'eighth' | 'ninth' | 'tenth' | 'eleventh' | 'twelfth' | 'fresh' | 'sophomore' | 'junior' | 'senior' | null
  remark: string | null
  status: number
  inclass: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
  clockAt: Date | null
  clockTeacherId: number | null
  imageUrl: string | null
  chatRoomId: string | null
  englishName: string | null
  level: 'elementary' | 'junior' | 'high' | 'university' | null
  enrollAt: Date | null
  introducer: string | null
  method: string | null
}

export const findAllStudents = async (limit: number, offset: number, trxs: Trxs): Promise<StudentV2[]> => {
  const query = v2db()
    .select()
    .from('students')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfStudent = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('students')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}

export const findStudentsByIds = async (studentIds: number[], trxs: Trxs): Promise<StudentV2[]> => {
  const query = v2db()
    .select()
    .from('students')
    .whereIn('id', studentIds)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const updateStudentHashedIdById = async ({ hashedId, chatRoomId }: { hashedId: string; chatRoomId: string }, studentId: number, trxs: Trxs): Promise<void> => {
  await v2db()
    .update({
      "hashed_id": hashedId,
      "chat_room_id": chatRoomId,
    })
    .from('students')
    .where('id', studentId)
    .transacting(trxs.v2db)
}
