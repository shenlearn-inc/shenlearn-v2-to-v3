import {Trxs} from "../types/Trxs.js";
import v3db from "../db/v3db.js";;
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
    .from('clazz_teacher_refs')
    .transacting(trxs.v3db)

  await query
  return
}
