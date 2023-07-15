import {findAllStudents, getNumberOfStudent, updateStudentHashedIdById} from "../v2models/students.js";
import {findTeachersByIds} from "../v2models/teachers.js";
import _ from "lodash";
import {createStudents} from "../v3models/students.js";
import toGradeNumber from "../utils/toGradeNumber.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import config from "../config/index.js";
import {createRooms} from "../v3chatModels/rooms.js";
import toStudentChatRoomId from "../utils/toStudentChatRoomId.js";
import toStudentId from "../utils/toStudentId.js";
import toSchoolId from "../utils/toSchoolId.js";
import toTeacherId from "../utils/toTeacherId.js";
import {Trxs} from "../types/Trxs.js";
import generateUUID from "../utils/generateUUID.js";
import v2chatdb from "../db/v2chatdb.js";
import v3db from "../db/v3db.js";
import {Site} from "../types/Site.js";

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移學生資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const numberOfStudent = await getNumberOfStudent(trxs)
  for (let i = 0; i < Math.ceil(numberOfStudent / config.chunkSize); i++) {
    // 找出學生
    // const students = camelcaseKeys([await v2db().first().from("students").where("hashed_id", "1ca1354a30d7b77784da06d88808355cc484069c")]);
    const students = await findAllStudents(config.chunkSize, i * config.chunkSize, trxs)
    // 找出負責老師
    const teachers = await findTeachersByIds(Array.from(new Set(students.map(s => s.teacherId))).filter(s => !!s) as number[], trxs)
    const teacherMap = _.keyBy(teachers, 'id')

    // 轉移學生
    for (const s of students) {
      if (site?.isHandleDuplicateHashedId) {
        const isExisted = await v3db().first().from("students").where("id", toStudentId(s.hashedId)).transacting(trxs.v3db)
        // 替換 hashedId
        if (isExisted) {
          // 產出新 hashedId
          const newHashedId = s.hashedId + "00000";

          // 轉換成 uuid
          const newChatRoomId = generateUUID(newHashedId);

          // 更新 student hashed_id chat_room_id
          await updateStudentHashedIdById({
            hashedId: newHashedId,
            chatRoomId: newChatRoomId,
          }, s.id, trxs)

          // 更新 chat.room: id, external_id
          await v2chatdb().from("rooms").update({ external_id: newHashedId }).where("id", generateUUID(s.hashedId)).transacting(trxs.v2chatdb);
          await v2chatdb().from("rooms").update({ id: newChatRoomId }).where("external_id", newHashedId).transacting(trxs.v2chatdb);

          // 更新 chat.message: room_id
          await v2chatdb().from("messages").update({ room_id: newChatRoomId }).where("room_id", generateUUID(s.hashedId)).transacting(trxs.v2chatdb);

          // 更新 chat.user_room_refs: room_id
          await v2chatdb().from("user_room_refs").update({ room_id: newChatRoomId }).where("room_id", generateUUID(s.hashedId)).transacting(trxs.v2chatdb);
          s.hashedId = newHashedId;
          s.chatRoomId = newChatRoomId;
        }
      }

      const chatRoomId = toStudentChatRoomId(s.hashedId)
      const studentId = toStudentId(s.hashedId)

      // 新建學生資料
      await createStudents([{
        id: studentId,
        username: s.aftsId,
        password: null,
        salt: null,
        accessToken: null,
        refreshToken: null,
        schoolId: toSchoolId(siteInfoV2.hashedId),
        roleId: config.studentRoleId,
        name: s.name ?? '',
        no: s.aftsId,
        avatarUrl: s.imageUrl,
        status: s.status ? 'active' : 'inactive',
        cardNo: s.cardId,
        dateOfBirth: s.birthday?.toISOString().slice(0, 10) ?? null,
        cellphonePrefix: s.cellphoneInternationalPrefix,
        cellphone: s.cellphone,
        telephonePrefix: s.telephoneInternationalPrefix,
        telephone: s.telephone,
        email: s.email,
        address: s.address ?? '',
        alias: s.englishName ?? '',
        schoolName: s.schoolName ?? '',
        gradeNo: toGradeNumber(s.grade),
        dateOfEnroll: s.enrollAt?.toISOString().slice(0, 10) ?? null,
        enrollmentMethod: '',
        highestDegreeEarned: s.level ?? '',
        remark: s.remark ?? '',
        advisorId: s.teacherId ? (s.teacherId in teacherMap ? toTeacherId(teacherMap[s.teacherId].hashedId) : null) : null,
        isInSchool: !!s.inclass,
        chatRoomId: chatRoomId,
        createdAt: s.createdAt ?? new Date(),
        updatedAt: s.updatedAt ?? new Date(),
        deletedAt: s.deletedAt,
      }], trxs)

      // 新建老師與學生的聊天室
      await createRooms([{
        id: chatRoomId,
        name: '',
        type: 'teachers-to-student',
        status: 'init',
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
    }
  }
}
