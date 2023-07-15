import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface AnnouncementV3 {
  id: string;
  schoolId: string;
  payload: any;
  method: "app" | "app-and-sms" | "sms";
  publishedAt: Date | null;
  additionalCharge: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const createAnnouncements = async (announcements: AnnouncementV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(announcements))
    .from('announcements')
    // @ts-ignore
    .onConflict('id')
    .ignore()
    .transacting(trxs.v3db)

  await query
  return
}
