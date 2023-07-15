import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface ClazzDiaryV3 {
  id: string;
  clazzId: string;
  teacherId: string;
  schoolId: string;
  payload: any;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const createClazzDiaries = async (clazzDiaries: ClazzDiaryV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(clazzDiaries))
    .from('clazz_diaries')
    // @ts-ignore
    .onConflict('id')
    .ignore()
    .transacting(trxs.v3db)

  await query
  return
}
