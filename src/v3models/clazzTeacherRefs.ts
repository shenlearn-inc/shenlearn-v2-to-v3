import {Trxs} from "@/types/Trxs";
import v3db from "@/db/v3db";
import snakecaseKeys from "snakecase-keys";

export interface ClazzTeacherRefV3 {
  id: string
  clazzId: string
  teacherId: string
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const createClazzTeacherRefs = async (refs: ClazzTeacherRefV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(refs))
    .transacting(trxs.v3db)

  await query
  return
}
