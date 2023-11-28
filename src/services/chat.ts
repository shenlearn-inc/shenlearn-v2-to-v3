import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import config from "../config/index.js";
import {findAllStudents, StudentV2} from "../v2models/students.js";
import toTeacherId from "../utils/toTeacherId.js";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";
import {findRoomByExternalId} from "../v2chatModels/rooms.js";
import toStudentChatRoomId from "../utils/toStudentChatRoomId.js";
import {findMessagesAfterTimeByRoomId, findMessagesByRoomId} from "../v2chatModels/messages.js";
import {findUsersByIds} from "../v2chatModels/users.js";
import toContactorId from "../utils/toContactorId.js";
import {createMessages, MessageV3} from "../v3chatModels/messages.js";
import {Site} from "../types/Site.js";
import toSchoolId from "../utils/toSchoolId.js";
import PQueue from "p-queue";

const convertPayloadV2ToPayloadV3 = (message: any) => {
  const type = message.type;
  if (type === "image") {
    const payload = JSON.parse(message.payload);
    return {
      name: payload?.text ?? "",
      url: payload.url,
    }
  } else if (type === "info") {
    try {
      const payload = JSON.parse(message.payload);
      return {
        title: payload?.title ?? "",
        text: payload?.content ?? "",
        images: payload.images?.map((image: any) => ({
          url: image.url,
        })) ?? [],
        actions: payload.actions?.map((action: any) => ({
          name: action?.name ?? action?.text ?? "",
          url: action.url
        }))
      }
    } catch (e) {
      return {
        text: message.payload ?? ""
      }
    }
  } else if (type === "file") {
    const payload = JSON.parse(message.payload);
    return {
      name: payload?.name ?? payload?.text ?? "",
      url: payload.url,
    }
  }
  return {
    text: message.payload ?? ""
  }
}

interface HandleStudentChatProps {
  student: StudentV2
  serviceDirector: TeacherV3
  site: Site
  trxs: Trxs
}

const handleStudentChat = async ({student, serviceDirector, site, trxs}: HandleStudentChatProps) => {
  if (!student.hashedId) {
    return;
  }
  const v2Room = await findRoomByExternalId(student.hashedId);
  if (!v2Room) {
    return;
  }

  // 正常
  // const v2Messages = await findMessagesByRoomId(v2Room.id);
  // 回補某時間之後的訊息
  const v2Messages = await findMessagesAfterTimeByRoomId(v2Room.id, '2023-11-26T00:00:00.000Z');

  if (!v2Messages.length) {
    return;
  }
  const userIdMap: { [key: string]: string } = {};
  const v2MessageUsers = await findUsersByIds(Array.from(new Set(v2Messages.map(message => message.userId))));
  for (const user of v2MessageUsers) {
    if (user.externalRole === "site") {
      userIdMap[user.id] = serviceDirector.id;
      continue;
    } else if (user.externalRole === "teacher") {
      userIdMap[user.id] = toTeacherId(user.externalId);
      continue;
    } else if (user.externalRole === "parent") {
      const result = /^(886|86|852)([0-9]+)$/.exec(user.externalId);
      if (result) {
        userIdMap[user.id] = toContactorId(result[1], result[2], site);
        continue;
      }
    }
    userIdMap[user.id] = config.unknownChatUser;
  }

  const v3ChatRoomId = toStudentChatRoomId(student.hashedId);
  const v3Messages = v2Messages.filter(v2message => v2message.userId in userIdMap).map((v2message) => {
    return {
      id: v2message.id,
      roomId: v3ChatRoomId,
      type: v2message.message.type,
      payload: convertPayloadV2ToPayloadV3(v2message.message),
      createdAt: v2message.createdAt,
      createdBy: userIdMap[v2message.userId],
      updatedAt: v2message.updatedAt,
      updatedBy: userIdMap[v2message.userId],
      deletedAt: v2message.deletedAt,
    } as MessageV3
  });

  // 正常
  // await createMessages(v3Messages, trxs);
  // 回補某時間之後的訊息使用
  for (const v3Message of v3Messages) {
    try {
      console.log(`轉移訊息 ${v3Message.createdAt}`)
      await createMessages([v3Message], trxs);
      console.log(`轉移訊息成功 ${v3Message.id}`)
    } catch (e) {
      console.error(`轉移訊息錯誤 ${v3Message.id}`)
    }
  }
}

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移聊天訊息')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 Service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  const students = await findAllStudents(999999, 0, trxs);

  const queue = new PQueue({concurrency: 10});

  students.forEach(student => {
    queue.add(() => handleStudentChat({
      student,
      serviceDirector,
      site,
      trxs
    })).catch((error: any) => {
      console.log('處理學生聊天訊息出錯: ', {
        studentId: student.hashedId,
        error
      });
    });
  });

  await queue.onIdle();
  console.log('所有學生聊天訊息處理完成');
}
