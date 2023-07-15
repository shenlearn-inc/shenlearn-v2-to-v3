import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ScoreV2 {
  id: number;
  hashedId: string;
  studentId: number;
  examId: number;
  score: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const findScoresByExamId = async (examId: number, trxs: Trxs): Promise<ScoreV2[]> => {
  const query = v2db()
    .select()
    .from('scores')
    .where('exam_id', examId)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
