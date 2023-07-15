import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ExamV2 {
  id: number
  hashedId: string
  courseId: number
  teacherId: number
  name: string
  remark: string
  examTagName: string
  createdAt: Date
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllExams = async (limit: number, offset: number, trxs: Trxs): Promise<ExamV2[]> => {
  const query = v2db()
    .select()
    .from('exams')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
