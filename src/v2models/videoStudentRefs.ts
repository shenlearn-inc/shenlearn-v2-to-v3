import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface VideoStudentRefV2 {
  id: number
  videoId: number
  studentId: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllVideoStudentRefsByVideoId = async (videoId: number, trxs: Trxs): Promise<VideoStudentRefV2[]> => {
  const query = v2db()
    .select()
    .from('video_student_refs')
    .where('video_id', videoId)
    .whereNull('deleted_at')
    .transacting(trxs.v2db)

  return camelcaseKeys(await query as any)
}
