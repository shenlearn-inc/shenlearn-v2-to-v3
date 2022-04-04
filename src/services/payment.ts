import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import config from "@/config";
import {findAllPayments, getNumberOfPayment} from "@/v2models/payments";
import {createPayments} from "@/v3models/payments";
import generateUUID from "@/utils/generateUUID";
import toSchoolId from "@/utils/toSchoolId";
import {createPaymentRoots} from "@/v3models/paymentRoots";
import v2db from "@/db/v2db";
import {findTeachersByIds, TeacherV2} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import {createPaymentItems} from "@/v3models/paymentItems";
import toPaymentId from "@/utils/toPaymentId";
import {PaymentItemV2} from "@/v2models/paymentItems";
import {findStudentsByIds, StudentV2} from "@/v2models/students";
import {keyBy} from "lodash"
import toStudentId from "@/utils/toStudentId";
import camelcaseKeys from "camelcase-keys";

export default async (trxs: Trxs) => {
  console.info('轉移繳費')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 取得 service 帳號
  const serviceDirector = await v2db()
    .first()
    .from('teachers')
    .where('name', 'Service') as TeacherV2

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
        teacherId: toTeacherId(serviceDirector.hashedId),
        paymentRootId: paymentRootId,
        price: v2Payment.price ?? 0,
        remark: v2Payment.remark ?? '',
        isPublic: v2Payment.isPublic ?? false,
        deadlineDate: v2Payment.deadlineAt?.toISOString().slice(0, 10) ?? null,
        startedDate: v2Payment.startedAt?.toISOString().slice(0, 10) ?? null,
        endedDate: v2Payment.endedAt?.toISOString().slice(0, 10) ?? null,
        courseId: null,
        creditCount: null,
        createdAt: v2Payment.createdAt ?? new Date(),
        updatedAt: v2Payment.updatedAt ?? new Date(),
        deletedAt: v2Payment.deletedAt,
      }], trxs)

      // Payment item
      const v2PaymentItems = camelcaseKeys(await v2db()
        .select()
        .from('payment_items')
        .where('payment_id', v2Payment.id)) as PaymentItemV2[]

      const v2Students = await findStudentsByIds(Array.from(new Set(v2PaymentItems.map(pi => pi.studentId))), trxs) as StudentV2[]
      const v2StudentMap = keyBy(v2Students, 'id')

      const v2Teachers = await findTeachersByIds(Array.from(new Set(v2PaymentItems.filter(pi => !!pi.teacherId).map(pi => pi.teacherId) as number[])), trxs) as TeacherV2[]
      const v2TeacherMap = keyBy(v2Teachers, 'id')

      await createPaymentItems(
        v2PaymentItems.map(pi => {
          return {
            id: toPaymentId(pi.hashedId),
            schoolId: schoolId,
            paymentId: paymentId,
            studentId: toStudentId(v2StudentMap[pi.studentId].hashedId),
            teacherId: toTeacherId(v2TeacherMap[pi.teacherId!].hashedId),
            name: v2Payment.name ?? '',
            price: v2Payment.price ?? 0,
            remark: v2Payment.remark ?? '',
            isPublic: v2Payment.isPublic ?? false,
            deadlineDate: v2Payment.deadlineAt?.toISOString().slice(0, 10) ?? null,
            startedDate: v2Payment.startedAt?.toISOString().slice(0, 10) ?? null,
            endedDate: v2Payment.endedAt?.toISOString().slice(0, 10) ?? null,
            receiptId: null,
            courseId: null,
            creditCount: null,
            order: null,
            createdAt: v2Payment.createdAt ?? new Date(),
            updatedAt: v2Payment.updatedAt ?? new Date(),
            deletedAt: v2Payment.deletedAt,
          }
        }),
        trxs,
      )
    }
  }
}
