import generateUUID from "../utils/generateUUID.js";
import config from "../config/index.js";
import {findAllStudentParents} from "../v2models/studentParents.js";
import {createContactors} from "../v3models/contactors.js";
import {createSubContactors} from "../v3models/subContactors.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import {findStudentsByIds} from "../v2models/students.js";
import _ from "lodash";
import {createRooms} from "../v3chatModels/rooms.js";
import {createRoomUserRefs} from "../v3chatModels/roomUserRefs.js";
import toStudentId from "../utils/toStudentId.js";
import toSubContactorChatRoomId from "../utils/toSubContactorChatRoomId.js";
import toContactorId from "../utils/toContactorId.js";
import toSchoolId from "../utils/toSchoolId.js";
import toStudentChatRoomId from "../utils/toStudentChatRoomId.js";
import {Trxs} from "../types/Trxs.js";
import {createUsers} from "../v3chatModels/users.js";
import {Site} from "../types/Site.js";

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移聯絡人資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得家長資料
  const studentParents = (await findAllStudentParents(999999, 0, trxs)).filter(s => !!s?.cellphoneInternationalPrefix && !!s?.cellphone)
  if (!studentParents.length) return

  const phoneNumbers = Array.from(new Set(studentParents.map(s => `${s.cellphoneInternationalPrefix}-${s.cellphone}`)))
  // 建立 contactor
  const handlerContactors = async () => {
    const chunks = [] as any;
    const chunkSize = 100;

    for (let i = 0; i < phoneNumbers.length; i += chunkSize) {
      const chunk = phoneNumbers.slice(i, i + chunkSize);
      const contactors = chunk.map(pn => {
        const [prefix, phone] = pn.split('-');
        return {
          id: toContactorId(prefix, phone, site),
          username: `${prefix}${phone}`,
          password: null,
          salt: null,
          accessToken: null,
          refreshToken: null,
          roleId: config.contactorRoleId,
          organizationId: site.organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
      });
      chunks.push(contactors);
    }

    for (const chunk of chunks) {
      await createContactors(chunk, trxs);
    }
  }
  await handlerContactors();

  // 建立 contactor chat user
  const handlerUsers = async () => {
    const users = phoneNumbers.map(pn => {
      const [prefix, phone] = pn.split('-');
      return {
        id: toContactorId(prefix, phone, site),
        name: `${prefix}-${phone}`,
        type: 'contactor',
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
    });

    const chunks = [] as any;
    const chunkSize = 100;

    for (let i = 0; i < users.length; i += chunkSize) {
      const chunk = users.slice(i, i + chunkSize);
      chunks.push(chunk);
    }

    for (const chunk of chunks) {
      // @ts-ignore
      await createUsers(chunk, trxs);
    }
  }
  await handlerUsers();

  // 找出所屬學生
  const students = await findStudentsByIds(Array.from(new Set(studentParents.map(sp => sp.studentId))).filter(id => !!id) as number[], trxs)
  const studentMap = _.keyBy(students, 'id')
  // 轉移子聯絡人
  for (const sp of studentParents) {
    if (!(sp.studentId! in studentMap)) {
      continue
    }
    const studentId = toStudentId(studentMap[sp.studentId!].hashedId)
    const student = studentMap[sp.studentId!]
    const chatRoomId = toSubContactorChatRoomId(sp.hashedId)

    await createSubContactors([{
      id: generateUUID(),
      contactorId: toContactorId(sp.cellphoneInternationalPrefix!, sp.cellphone!, site),
      schoolId: toSchoolId(siteInfoV2.hashedId),
      studentId: studentId,
      name: sp.name ?? '',
      relationship: sp.relationship ?? 'others',
      cellphonePrefix: sp.cellphoneInternationalPrefix!,
      cellphone: sp.cellphone!,
      isSms: false,
      chatRoomId: chatRoomId,
      createdAt: sp.createdAt ?? new Date(),
      updatedAt: sp.updatedAt ?? new Date(),
      deletedAt: sp.deletedAt,
    }], trxs)

    // 新建老師與子聯絡人的聊天室
    await createRooms([{
      id: chatRoomId,
      name: '',
      status: "init",
      type: 'teachers-to-sub-contactor',
      avatarUrl: null,
      externalId: studentId,
      lastMessage: null,
      lastMessageAt: null,
      lastChatMessageAt: null,
      lastChatMessage: null,
      deactivatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }], trxs)

    if (!sp.deletedAt) {
      // 把子聯絡人加入聊天室
      await createRoomUserRefs([
        // 所有聯絡人聊天室
        {
          id: generateUUID(),
          userId: toContactorId(sp.cellphoneInternationalPrefix!, sp.cellphone!, site),
          userName: `${sp.relationship ?? 'others'}(${sp.cellphoneInternationalPrefix!}-${sp.cellphone!})`,
          userAvatarUrl: null,
          roomId: toStudentChatRoomId(studentMap[sp.studentId!].hashedId),
          roomName: siteInfoV2.name,
          roomSubName: student.name ?? '',
          roomAvatarUrl: siteInfoV2.imageUrl,
          unread: 0,
          lastSeenAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        // 單獨聊天室
        {
          id: generateUUID(),
          userId: toContactorId(sp.cellphoneInternationalPrefix!, sp.cellphone!, site),
          userName: `${sp.relationship ?? 'others'}(${sp.cellphoneInternationalPrefix!}-${sp.cellphone!})`,
          userAvatarUrl: null,
          roomId: chatRoomId,
          roomName: siteInfoV2.name,
          roomSubName: student.name ?? '',
          roomAvatarUrl: siteInfoV2.imageUrl,
          unread: 0,
          lastSeenAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }
      ], trxs)
    }
  }
}
