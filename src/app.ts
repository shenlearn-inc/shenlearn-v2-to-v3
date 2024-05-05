import v2db from "./db/v2db.js"
import v3db from "./db/v3db.js"
import v3chatdb from "./db/v3chatdb.js"
import config from "./config/index.js"
import student from "./services/student.js"
import school from "./services/school.js"
import contactor from "./services/contactor.js"
import teacher from "./services/teacher.js"
import course from "./services/course.js"
import {Trxs} from "./types/Trxs.js";
import clazz from "./services/clazz.js";
import clazzRef from "./services/clazzRef.js";
import teacherAndStudentChatRoomRefs from "./services/teacherAndStudentChatRoomRefs.js";
import lesson from "./services/lesson.js";
import payment from "./services/payment.js";
import receipt from "./services/receipt.js";
import attendance from "./services/attendance.js";
import studentSchedule from "./services/studentSchedule.js";
import clear from "./services/clear.js";
import credit from "./services/credit.js";
import chat from "./services/chat.js";
import signDevice from "./services/signDevice.js";
import announcement from "./services/announcement.js";
import clazzDiaries from "./services/clazzDiaries.js";
import exam from "./services/exam.js";
import studentDiary from "./services/studentDiary.js";
import v2chatdb from "./db/v2chatdb.js";
import video from "./services/video.js";
import paymentItemReceiptFix from "./services/paymentItemReceiptFix.js";
import paymentConfigFix from "./services/paymentConfigFix.js";
import noEndTimeAttendanceFix from "./services/noEndTimeAttendanceFix.js";
import creditFix from "./services/creditFix.js";

export const run = async (): Promise<void> => {
  for (const site of config.sites) {
    console.info(`${site.name} migration started`)
    const startTime = new Date().getTime();
    v2db(site.name, true)
    v3db(config.v3db.database)
    v3chatdb(config.v3chatdb.database)

    await v2db().transaction(async v2dbTRX => {
      await v2chatdb().transaction(async v2chatdbTRX => {
        await v3db().transaction(async v3dbTRX => {
          await v3chatdb().transaction(async v3chatdbTRX => {
            // const trxs = {
            //   v2db: "123" as any,
            //   v2chatdb: "123" as any,
            //   v3db: "123" as any,
            //   v3chatdb: "123" as any,
            // } as Trxs

            const trxs = {
              v2db: v2dbTRX,
              v2chatdb: v2chatdbTRX,
              v3db: v3dbTRX,
              v3chatdb: v3chatdbTRX,
            } as Trxs

            // 清空學校資料
            // await clear(site, trxs)
            //
            // // 轉移學校
            // await school(site, trxs)
            //
            // // 轉移學生
            // await student(site, trxs)
            //
            // // 轉移家長
            // await contactor(site, trxs)
            //
            // // 轉移老師
            // await teacher(site, trxs)
            //
            // // 轉移課種
            // await course(site, trxs)
            //
            // // 轉移班級與班級時間
            // await clazz(site, trxs)
            //
            // // 轉移班級關係
            // await clazzRef(trxs)
            //
            // // 轉移老師與學生聊天室關係
            // await teacherAndStudentChatRoomRefs(trxs)
            //
            // // 轉移聊天室訊息
            // await chat(site, trxs)
            //
            // // 轉移課堂
            // await lesson(site, trxs)
            //
            // // 轉移繳費
            // await payment(trxs)
            //
            // // 轉移收據
            // await receipt(trxs)
            //
            // // 轉移出勤
            // await attendance(site, trxs)
            //
            // // 轉移請假
            // await studentSchedule(trxs)
            //
            // // 轉移堂次
            // await credit(trxs)
            //
            // // 轉移電訪資料
            // await studentDiary(site, trxs)
            //
            // // 轉移簽到機資料
            // await signDevice(site, trxs)
            //
            // // 轉移班級日誌
            // await clazzDiaries(trxs)
            //
            // // 轉移考試
            // await exam(trxs)
            //
            // // 轉移校園公告
            // await announcement(trxs)
            //
            // // 轉移影片
            // await video(trxs)
            //
            // // 修復繳費項目沒有收據 id 問題
            // await paymentItemReceiptFix(trxs)
            //
            // // 修復繳費備註
            // await paymentConfigFix(trxs)
            //
            // // 修復有些學生學校出勤沒有下課時間問題
            // await noEndTimeAttendanceFix(trxs)

            // 修復堂次
            await creditFix(trxs)

          })
        })
      })
    })
    console.info(`${site.name} migration done, time elapsed: ${(new Date().getTime() - startTime) / 1000}s`)
  }
}
export default run
