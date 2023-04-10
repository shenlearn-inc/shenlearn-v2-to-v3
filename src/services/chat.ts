import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import config from "@/config";
import {findAllStudents} from "@/v2models/students";
import toTeacherId from "@/utils/toTeacherId";
import v3db from "@/db/v3db";
import {TeacherV3} from "@/v3models/teachers";
import {findRoomByExternalId} from "@/v2chatModels/rooms";
import toStudentChatRoomId from "@/utils/toStudentChatRoomId";
import {findMessagesByRoomId} from "@/v2chatModels/messages";
import {findUsersByIds} from "@/v2chatModels/users";
import toContactorId from "@/utils/toContactorId";
import {createMessages, MessageV3} from "@/v3chatModels/messages";

const convertPayloadV2ToPayloadV3 = (message: any) => {
  const type = message.message.type;
  if (type === "image") {
    const payload = JSON.parse(message.message.payload);
    return {
      name: payload.text ?? "",
      url: payload.url,
    }
  } else if (type === "info") {
    const payload = JSON.parse(message.message.payload);
    return {
      title: payload.title ?? "",
      text: payload.content ?? "",
      images: payload.images?.map((image: any) => ({
        url: image.url,
      })) ?? [],
      actions: payload.actions?.map((action: any) => ({
        name: action.name ?? action.text ?? "",
        url: action.url
      }))
    }
  } else if (type === "file") {
    const payload = JSON.parse(message.message.payload);
    return {
      name: payload.name ?? payload.text ?? "",
      url: payload.url,
    }
  }
  return {
    text: message.message.payload ?? ""
  }
}

export default async (trxs: Trxs) => {
  console.info('轉移聊天訊息')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 取得 Service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .transacting(trxs.v3db) as TeacherV3

  const students = await findAllStudents(999999, 0, trxs);
  for (const student of students) {
    if (!student.hashedId) {
      continue;
    }
    const v2Room = await findRoomByExternalId(student.hashedId);
    if (!v2Room) {
      continue;
    }
    const v2Messages = await findMessagesByRoomId(v2Room.id);
    if (!v2Messages.length) {
      continue;
    }
    const userIdMap: { [key: string]: string } = {};
    const v2MessageUsers = await findUsersByIds(v2Messages.map(message => message.userId));
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
          userIdMap[user.id] = toContactorId(result[1], result[2]);
          continue;
        }
      }
      userIdMap[user.id] = config.unknownChatUser;
    }

    const v3ChatRoomId = toStudentChatRoomId(student.hashedId);
    const v3Messages = v2Messages.map((v2message) => {
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
    await createMessages(v3Messages, trxs);
  }
}
