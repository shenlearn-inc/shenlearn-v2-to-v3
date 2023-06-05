import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import {findAllReceipts, getNumberOfReceipt} from "@/v2models/receipts";
import config from "@/config";
import {createReceipts} from "@/v3models/receipts";
import generateUUID from "@/utils/generateUUID";
import toSchoolId from "@/utils/toSchoolId";
import {findStudentsByIds} from "@/v2models/students";
import {findTeachersByIds} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import toStudentId from "@/utils/toStudentId";
import v2db from "@/db/v2db";
import {ReceiptPaymentItemRefV2} from "@/v2models/receiptPaymentItemRefs";
import v3db from "@/db/v3db";
import {findPaymentItemsByIds} from "@/v2models/paymentItems";
import camelcaseKeys from "camelcase-keys";

export default async (trxs: Trxs) => {
  console.info('轉移收據')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  const numberOfReceipt = await getNumberOfReceipt(trxs)
  for (let i = 0; i < Math.ceil(numberOfReceipt / config.chunkSize); i++) {
    // 找出收據
    const v2Receipts = await findAllReceipts(config.chunkSize, i * config.chunkSize, trxs)

    for (const v2Receipt of v2Receipts) {
      console.info(`正在處理收據 ${v2Receipt.hashedId}`)
      const receiptId = generateUUID(v2Receipt.hashedId)

      const [student] = await findStudentsByIds([v2Receipt.studentId!], trxs)
      if (!student || !student.hashedId) continue;

      const [teacher] = await findTeachersByIds([v2Receipt.teacherId!], trxs)

      await createReceipts([{
        id: receiptId,
        schoolId: schoolId,
        studentId: toStudentId(student.hashedId),
        teacherId: toTeacherId(teacher.hashedId),
        number: v2Receipt.number ?? '',
        payType: v2Receipt.payType ?? 'others',
        totalPrice: v2Receipt.price ?? 0,
        remark: v2Receipt.remark ?? '',
        paidAt: v2Receipt.paidAt,
        createdAt: v2Receipt.createdAt ?? new Date(),
        updatedAt: v2Receipt.updatedAt ?? new Date(),
        deletedAt: v2Receipt.deletedAt,
        url: v2Receipt.url ?? '',
        paymentConfigId: null,
      }], trxs)

      // 將已繳費的 payment item 填入 receiptId
      const v2refs = camelcaseKeys(await v2db()
        .select()
        .from('receipt_payment_item_refs')
        .where('receipt_id', v2Receipt.id)) as ReceiptPaymentItemRefV2[]

      const paymentItems = await findPaymentItemsByIds(v2refs.map(r => r.paymentItemId), trxs)

      if (!paymentItems.length) continue

      await v3db()
        .update({
          receipt_id: receiptId
        })
        .from('payment_items')
        .whereIn('id', paymentItems.map(pi => generateUUID(pi.hashedId)))
        .transacting(trxs.v3db)
    }
  }
}
