import v2db from "./db/v2db"
import v3db from "./db/v3db"
import v3chatdb from "@/db/v3chatdb"
import config from "./config"
import student from "@/services/student"
import school from "@/services/school"
import v2centraldb from "@/db/v2centraldb"
import contactor from "@/services/contactor"
import teacher from "@/services/teacher"
import course from "@/services/course"
import {Trxs} from "@/types/Trxs";
import clazz from "@/services/clazz";
import clazzRef from "@/services/clazzRef";
import teacherAndStudentChatRoomRefs from "@/services/teacherAndStudentChatRoomRefs";

const main = async () => {
  v2centraldb()
  v2db(config.site)
  v3db('shenlearn-v3-backend-server')
  v3chatdb('shenlearn-v3-chat-server')

  await v2centraldb().transaction(async v2centraldbTRX => {
    await v2db().transaction(async v2dbTRX => {
      await v3db().transaction(async v3dbTRX => {
        await v3chatdb().transaction(async v3chatdbTRX => {
          const trxs = {
            v2centraldb: v2centraldbTRX,
            v2db: v2dbTRX,
            v3db: v3dbTRX,
            v3chatdb: v3chatdbTRX,
          } as Trxs

          // 轉移學校
          await school(trxs)

          // 轉移學生
          await student(trxs)

          // 轉移家長
          await contactor(trxs)

          // 轉移老師
          await teacher(trxs)

          // 轉移課種
          await course(trxs)

          // 轉移班級與班級時間
          await clazz(trxs)

          // 轉移班級關係
          await clazzRef(trxs)

          // 轉移老師與學生聊天室關係
          await teacherAndStudentChatRoomRefs(trxs)

          // 轉移課堂


          // 轉移繳費

          // 轉移收據

          // 轉移到校出勤

          // 轉移班級出勤

          // 轉移請假
        })
      })
    })
  })
}

main()
