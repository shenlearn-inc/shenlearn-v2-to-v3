import v3db from "@/db/v3db"
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "@/types/Trxs";

export interface AnnouncementStudentRefV3 {
  id: string;
  announcementId: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const createAnnouncementStudentRefs = async (refs: AnnouncementStudentRefV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(refs))
    .from('announcement_student_refs')
    // @ts-ignore
    .onConflict('id')
    .ignore()
    .transacting(trxs.v3db)

  await query
  return
}
