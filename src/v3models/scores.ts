import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ScoreV3 {
  id: string;
  examId: string;
  studentId: string;
  score: string | null;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const createScores = async (scores: ScoreV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(scores))
    .from('scores')
    .transacting(trxs.v3db)

  await query
  return
}
