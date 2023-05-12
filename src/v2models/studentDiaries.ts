import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface StudentDiaryV2 {
  id: number
  hashedId: string
  studentId: number
  teacherId: number
  content: string
  createdAt: Date
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllStudentDiaries = async (limit: number, offset: number, trxs: Trxs): Promise<StudentDiaryV2[]> => {
  const query = v2db()
    .select()
    .from('student_diaries')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
