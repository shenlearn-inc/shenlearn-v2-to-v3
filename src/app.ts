import v2db from "./db/v2db"
import v3db from "./db/v3db"
import v3chatdb from "@/db/v3chatdb"
import config from "./config"
import student from "@/services/student"
import school from "@/services/school"
import contactor from "@/services/contactor"
import teacher from "@/services/teacher"
import course from "@/services/course"
import {Trxs} from "@/types/Trxs";
import clazz from "@/services/clazz";
import clazzRef from "@/services/clazzRef";
import teacherAndStudentChatRoomRefs from "@/services/teacherAndStudentChatRoomRefs";
import lesson from "@/services/lesson";
import payment from "@/services/payment";
import receipt from "@/services/receipt";
import attendance from "@/services/attendance";
import studentSchedule from "@/services/studentSchedule";
import clear from "@/services/clear";
import credit from "@/services/credit";
import chat from "@/services/chat";
import signDevice from "@/services/signDevice";
import announcement from "@/services/announcement";
import clazzDiaries from "@/services/clazzDiaries";

export const run = async (): Promise<void> => {
  console.info('Run')
  v2db(config.site)
  v3db(config.v3db.database)
  v3chatdb(config.v3chatdb.database)

  await v2db().transaction(async v2dbTRX => {
    await v3db().transaction(async v3dbTRX => {
      await v3chatdb().transaction(async v3chatdbTRX => {
        const trxs = {
          v2db: v2dbTRX,
          v3db: v3dbTRX,
          v3chatdb: v3chatdbTRX,
        } as Trxs

        // // 清空學校資料
        // await clear(trxs)
        //
        // // 轉移學校
        // await school(trxs)
        //
        // // 轉移學生
        // await student(trxs)
        //
        // // 轉移家長
        // await contactor(trxs)
        //
        // // 轉移老師
        // await teacher(trxs)
        //
        // // 轉移課種
        // await course(trxs)
        //
        // // 轉移班級與班級時間
        // await clazz(trxs)
        //
        // // 轉移班級關係
        // await clazzRef(trxs)
        //
        // // 轉移老師與學生聊天室關係
        // await teacherAndStudentChatRoomRefs(trxs)
        //
        // // 轉移聊天室訊息
        // await chat(trxs)
        //
        // // 轉移課堂
        // await lesson(trxs)
        //
        // // 轉移繳費
        // await payment(trxs)
        //
        // // 轉移收據
        // await receipt(trxs)
        //
        // // 轉移出勤
        // await attendance(trxs)
        //
        // // 轉移請假
        // await studentSchedule(trxs)
        //
        // // 轉移堂次
        // await credit(trxs)
        //
        // // 轉移簽到機資料
        // await signDevice(trxs)

        // 轉移班級日誌
        await clazzDiaries(trxs)

        // 轉移校園公告
        await announcement(trxs)
      })
    })
  })

  console.info('Done')
}
