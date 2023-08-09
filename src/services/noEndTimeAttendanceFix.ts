import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import v3db from "../db/v3db.js";
import toSchoolId from "../utils/toSchoolId.js";
import {TeacherV3} from "../v3models/teachers.js";
import v2db from "../db/v2db.js";
import _ from "lodash";
import generateUUID from "../utils/generateUUID.js";
import PQueue from "p-queue";
import snakecaseKeys from "snakecase-keys";
import {DateTime} from "luxon";

export default async (trxs: Trxs) => {
  console.info('修復有些學生學校出勤沒有下課時間問題')
  const startTime = new Date().getTime();

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const v3schoolId = toSchoolId(siteInfoV2.hashedId);

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  // await v3db().from('payment_items').update({'receipt_id': null}).where('receipt_id', globalReceiptId)

  const notEndedAttendances = await v3db().select().from('student_school_attendances').whereNotNull('started_at').whereNull('ended_at').where('started_at', '<=', '2023-08-08 05:00:00')
  console.log(`總共有 ${notEndedAttendances.length} 個出勤`);

  // let count = 0;
  for (const att of notEndedAttendances) {
    // if (count > 10) break;
    const endedAt = DateTime.fromISO(att.started_at.toISOString()).setZone("Asia/Taipei").endOf('day').toISO();
    await v3db().from('student_school_attendances').update({ ended_at: endedAt }).where('id', att.id)
    console.log(`id: ${att.id}, ended_at: ${endedAt}`);
    // count++;
  }

  console.log(`完成`);
}
