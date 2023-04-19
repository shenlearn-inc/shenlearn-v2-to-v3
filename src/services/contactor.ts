import generateUUID from "@/utils/generateUUID"
import config from "@/config"
import {findAllStudentParents} from "@/v2models/studentParents";
import {createContactors} from "@/v3models/contactors";
import {createSubContactors} from "@/v3models/subContactors";
import {findSiteInfo} from "@/v2models/siteInfo";
import {findStudentsByIds} from "@/v2models/students";
import {keyBy} from "lodash";
import {createRooms} from "@/v3chatModels/rooms";
import {createRoomUserRefs} from "@/v3chatModels/roomUserRefs";
import toStudentId from "@/utils/toStudentId";
import toSubContactorChatRoomId from "@/utils/toSubContactorChatRoomId";
import toContactorId from "@/utils/toContactorId";
import toSchoolId from "@/utils/toSchoolId";
import toStudentChatRoomId from "@/utils/toStudentChatRoomId";
import {Trxs} from "@/types/Trxs";
import {createUsers} from "@/v3chatModels/users";

export default async (trxs: Trxs) => {
  console.info('轉移聯絡人資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得家長資料
  const studentParents = await findAllStudentParents(999999, 0, trxs)
  if (!studentParents.length) return

  // 建立 contactor
  const phoneNumbers = Array.from(new Set(studentParents.map(s => `${s.cellphoneInternationalPrefix}-${s.cellphone}`)))
  for (const phoneNumber of phoneNumbers) {
    console.log(phoneNumber);
    const [prefix, phone] = phoneNumber.split('-')
    await createContactors([{
      id: toContactorId(prefix, phone),
      username: `${prefix}${phone}`,
      password: null,
      salt: null,
      accessToken: null,
      refreshToken: null,
      roleId: config.contactorRoleId,
      organizationId: config.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }], trxs)
  }

  // 建立 contactor chat user
  await createUsers(phoneNumbers.map(pn => {
    const [prefix, phone] = pn.split('-')
    return {
      id: toContactorId(prefix, phone),
      name: `${prefix}-${phone}`,
      type: 'contactor',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }
  }), trxs)

  // 找出所屬學生
  const students = await findStudentsByIds(Array.from(new Set(studentParents.map(sp => sp.studentId))).filter(id => !!id) as number[], trxs)
  const studentMap = keyBy(students, 'id')
  // 轉移子聯絡人
  for (const sp of studentParents) {
    const studentId = toStudentId(studentMap[sp.studentId!].hashedId)
    const student = studentMap[sp.studentId!]
    const chatRoomId = toSubContactorChatRoomId(sp.hashedId)

    await createSubContactors([{
      id: generateUUID(),
      contactorId: toContactorId(sp.cellphoneInternationalPrefix!, sp.cellphone!),
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
      type: 'teachers-to-sub-contactor',
      avatarUrl: null,
      externalId: studentId,
      lastMessage: null,
      lastMessageAt: null,
      lastChatMessageAt: null,
      lastChatMessage: null,
      deactivatedAt: null,
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
          userId: toContactorId(sp.cellphoneInternationalPrefix!, sp.cellphone!),
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
          userId: toContactorId(sp.cellphoneInternationalPrefix!, sp.cellphone!),
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
