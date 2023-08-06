import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import config from "../config/index.js";
import {findAllPayments, getNumberOfPayment} from "../v2models/payments.js";
import {createPayments} from "../v3models/payments.js";
import generateUUID from "../utils/generateUUID.js";
import toSchoolId from "../utils/toSchoolId.js";
import {createPaymentRoots} from "../v3models/paymentRoots.js";
import v2db from "../db/v2db.js";
import {findTeachersByIds, TeacherV2} from "../v2models/teachers.js";
import toTeacherId from "../utils/toTeacherId.js";
import {createPaymentItems} from "../v3models/paymentItems.js";
import toPaymentId from "../utils/toPaymentId.js";
import {PaymentItemV2} from "../v2models/paymentItems.js";
import {findStudentsByIds, StudentV2} from "../v2models/students.js";
import _ from "lodash"
import toStudentId from "../utils/toStudentId.js";
import camelcaseKeys from "camelcase-keys";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";
import toDateStr from "../utils/toDateStr.js";
import toValidDateObj from "../utils/toValidDateObj.js";

export default async (trxs: Trxs) => {
  console.info('轉移繳費')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', schoolId)
    .transacting(trxs.v3db) as TeacherV3

  const numberOfPayment = await getNumberOfPayment(trxs)
  for (let i = 0; i < Math.ceil(numberOfPayment / config.chunkSize); i++) {

    // 找出繳費
    const v2Payments = await findAllPayments(config.chunkSize, i * config.chunkSize, trxs)

    for (const v2Payment of v2Payments) {
      // Payment root
      const paymentRootId = generateUUID()
      await createPaymentRoots([{
        id: paymentRootId,
        schoolId: schoolId,
        name: v2Payment.name ?? '',
        cycleDay: 0,
        isOnline: true,
        remark: '',
        createdAt: v2Payment.createdAt ?? new Date(),
        updatedAt: v2Payment.updatedAt ?? new Date(),
        deletedAt: v2Payment.deletedAt,
      }], trxs)

      // Payment
      const paymentId = generateUUID(v2Payment.hashedId)
      await createPayments([{
        id: paymentId,
        schoolId: schoolId,
        teacherId: serviceDirector.id,
        paymentRootId: paymentRootId,
        price: v2Payment.price ?? 0,
        remark: v2Payment.remark ?? '',
        isPublic: v2Payment.isPublic ?? false,
        deadlineDate: toValidDateObj(v2Payment.deadlineAt)?.toISOString().slice(0, 10) ?? null,
        startedDate: toValidDateObj(v2Payment.startedAt)?.toISOString().slice(0, 10) ?? null,
        endedDate: toValidDateObj(v2Payment.endedAt)?.toISOString().slice(0, 10) ?? null,
        courseId: null,
        creditCount: null,
        createdAt: v2Payment.createdAt ?? new Date(),
        updatedAt: v2Payment.updatedAt ?? new Date(),
        deletedAt: v2Payment.deletedAt,
      }], trxs)

      // Payment item
      const v2PaymentItems = camelcaseKeys(
        await v2db()
        .select()
        .from('payment_items')
        .where('payment_id', v2Payment.id)
      ) as PaymentItemV2[]

      const v2Students = await findStudentsByIds(Array.from(new Set(v2PaymentItems.map(pi => pi.studentId))), trxs) as StudentV2[]
      const v2StudentMap = _.keyBy(v2Students, 'id')

      const v2Teachers = await findTeachersByIds(Array.from(new Set(v2PaymentItems.filter(pi => !!pi.teacherId).map(pi => pi.teacherId) as number[])), trxs) as TeacherV2[]
      const v2TeacherMap = _.keyBy(v2Teachers, 'id')

      await createPaymentItems(
        v2PaymentItems.map(pi => {
          const teacherId = pi.teacherId! in v2TeacherMap ? toTeacherId(v2TeacherMap[pi.teacherId!].hashedId) : serviceDirector.id
          return {
            id: toPaymentId(pi.hashedId),
            schoolId: schoolId,
            paymentId: paymentId,
            studentId: toStudentId(v2StudentMap[pi.studentId].hashedId),
            teacherId: teacherId,
            name: v2Payment.name ?? '',
            price: pi.price ?? 0,
            remark: pi.remark ?? '',
            isPublic: !!pi.isPublic,
            deadlineDate: toDateStr(pi.deadlineAt),
            startedDate: toDateStr(pi.startedAt),
            endedDate: toDateStr(pi.endedAt),
            receiptId: null,
            courseId: null,
            creditCount: null,
            order: null,
            createdAt: pi.createdAt ?? new Date(),
            updatedAt: pi.updatedAt ?? new Date(),
            deletedAt: pi.deletedAt,
          }
        }),
        trxs,
      )
    }
  }
}
