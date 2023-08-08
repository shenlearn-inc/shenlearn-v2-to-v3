import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import v3db from "../db/v3db.js";
import toSchoolId from "../utils/toSchoolId.js";
import {TeacherV3} from "../v3models/teachers.js";
import v2db from "../db/v2db.js";
import _ from "lodash";
import generateUUID from "../utils/generateUUID.js";
import PQueue from "p-queue";

const globalReceiptId = "fddb46e2-04ef-4fca-8fed-bef19c6e96ba"

export default async (trxs: Trxs) => {
  console.info('修補繳費項目的收據')
  const startTime = new Date().getTime();

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  // const serviceDirector = await v3db()
  //   .first()
  //   .from('teachers')
  //   .where('no', 'T00000001')
  //   .where('school_id', toSchoolId(siteInfoV2.hashedId))
  //   .transacting(trxs.v3db) as TeacherV3

  // await v3db().from('payment_items').update({'receipt_id': null}).where('receipt_id', globalReceiptId)

  // 找出繳費項目
  const v2paymentItems = await v2db().select().from('payment_items').whereNotNull('paid_at').whereNull('deleted_at')
  console.log(`總共 ${v2paymentItems.length} 個繳費項目要處理`);
  // const v2paymentItemMap = _.keyBy(v2paymentItems, 'id')
  const v2paymentItemIds = v2paymentItems.map(p => p.id);

  const v2receiptPaymentItemRefs = await v2db().select().from('receipt_payment_item_refs').whereIn('payment_item_id', v2paymentItemIds).whereNull('deleted_at')
  console.log(`總共 ${v2receiptPaymentItemRefs.length} 個 ref`);
  const v2refMap = _.keyBy(v2receiptPaymentItemRefs, 'payment_item_id')
  const v2receiptIds = Array.from(new Set(v2receiptPaymentItemRefs.map(ref => ref.receipt_id))) as string[]
  const v2receipts = await v2db().select().from('receipts').whereIn('id', v2receiptIds).whereNull('deleted_at')
  const v2receiptMap = _.keyBy(v2receipts, 'id')

  const updatePaymentItem = async (v2paymentItem, i) => {
    if (!v2paymentItem.paid_at) {
      return
    }
    const startTime = new Date().getTime();
    const v3paymentId = generateUUID(v2paymentItem.hashed_id);
    if (!(v2paymentItem.id in v2refMap)) {
      await v3db().from("payment_items").update({ receipt_id: globalReceiptId }).where('id', v3paymentId)
      console.log(`[${i}] 直接更新項目1 ${v2paymentItem.hashed_id}, ${(new Date().getTime() - startTime) / 1000}s`);
      return
    }
    const receiptId = v2refMap[v2paymentItem.id].receipt_id
    if (receiptId === 0) {
      await v3db().from("payment_items").update({ receipt_id: globalReceiptId }).where('id', v3paymentId)
      console.log(`[${i}] 直接更新項目2 ${v2paymentItem.hashed_id}, ${(new Date().getTime() - startTime) / 1000}s`);
      return
    }
    if (!(receiptId in v2receiptMap)) {
      await v3db().from("payment_items").update({ receipt_id: globalReceiptId }).where('id', v3paymentId)
      console.log(`[${i}] 直接更新項目3 ${v2paymentItem.hashed_id}, ${(new Date().getTime() - startTime) / 1000}s`);
      return;
    }
    const receipt = v2receiptMap[receiptId]
    const v3ReceiptId = generateUUID(receipt.hashed_id);
    await v3db().from("payment_items").update({ receipt_id: v3ReceiptId }).where('id', v3paymentId)
    console.log(`[${i}] 已處理項目 ${v2paymentItem.hashed_id}, ${(new Date().getTime() - startTime) / 1000}s`);
  }

  const queue = new PQueue({concurrency: 10});
  v2paymentItems.forEach((v2paymentItem, i) => {
    queue.add(() => updatePaymentItem(v2paymentItem, i)).catch((error: any) => {
      console.log('處理繳費項目出錯: ', {
        v2paymentItem,
        error
      });
    });
  });
  await queue.onIdle();

  console.log(`所有繳費項目處理完成, time elapsed: ${(new Date().getTime() - startTime) / 1000}s`);
}
