import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ExamV3 {
  id: string;
  name: string;
  schoolId: string;
  clazzId: string;
  teacherId: string;
  remark: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const createExams = async (exams: ExamV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(exams))
    .from('exams')
    .transacting(trxs.v3db)

  await query
  return
}
