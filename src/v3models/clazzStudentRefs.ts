import {Trxs} from "@/types/Trxs";
import v3db from "@/db/v3db";
import snakecaseKeys from "snakecase-keys";

export interface ClazzStudentRefV3 {
  id: string
  clazzId: string
  studentId: string
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const createClazzStudentRefs = async (refs: ClazzStudentRefV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(refs))
    .transacting(trxs.v3db)

  await query
  return
}
