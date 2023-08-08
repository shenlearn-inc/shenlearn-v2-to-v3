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

export default async (trxs: Trxs) => {
  console.info('修補繳費備註')
  const startTime = new Date().getTime();

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const v3schoolId = toSchoolId(siteInfoV2.hashedId);

  // 取得 service 帳號
  // const serviceDirector = await v3db()
  //   .first()
  //   .from('teachers')
  //   .where('no', 'T00000001')
  //   .where('school_id', toSchoolId(siteInfoV2.hashedId))
  //   .transacting(trxs.v3db) as TeacherV3

  // await v3db().from('payment_items').update({'receipt_id': null}).where('receipt_id', globalReceiptId)

  const v3currentPaymentConfig = await v3db().first().from('payment_configs').where('school_id', v3schoolId).whereNull('deleted_at')
  if (v3currentPaymentConfig && (!!v3currentPaymentConfig.notice_remark || !!v3currentPaymentConfig.receipt_remark)) {
    console.log(`已經有繳費備註不用轉移資料`);
    return;
  }
  if (v3currentPaymentConfig) {
    console.log(`繳費備註是空的要清除`);
    await v3db().update({ deleted_at: new Date().toISOString() }).from('payment_configs').where('school_id', v3schoolId).whereNull('deleted_at')
    return;
  }
  if (siteInfoV2?.noticeNote || siteInfoV2?.receiptNote) {
    await v3db()
      .insert({
        school_id: toSchoolId(siteInfoV2.hashedId),
        notice_remark: siteInfoV2?.noticeNote ?? "",
        receipt_remark: siteInfoV2?.receiptNote ?? "",
      })
      .from('payment_configs')
      .transacting(trxs.v3db)
    console.log(`已更新繳費備註, time elapsed: ${(new Date().getTime() - startTime) / 1000}s`);
    return
  }
  console.log(`繳費備註原本就是空的不用轉移`);
}
