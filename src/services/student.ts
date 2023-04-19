import {findAllStudents, getNumberOfStudent} from "@/v2models/students"
import {findTeachersByIds} from "@/v2models/teachers"
import {keyBy} from "lodash"
import {createStudents} from "@/v3models/students"
import toGradeNumber from "@/utils/toGradeNumber"
import {findSiteInfo} from "@/v2models/siteInfo"
import config from "@/config"
import {createRooms} from "@/v3chatModels/rooms"
import toStudentChatRoomId from "@/utils/toStudentChatRoomId"
import toStudentId from "@/utils/toStudentId"
import toSchoolId from "@/utils/toSchoolId"
import toTeacherId from "@/utils/toTeacherId"
import {Trxs} from "@/types/Trxs";

export default async (trxs: Trxs) => {
  console.info('轉移學生資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const numberOfStudent = await getNumberOfStudent(trxs)
  for (let i = 0; i < Math.ceil(numberOfStudent / config.chunkSize); i++) {
    // 找出學生
    const students = await findAllStudents(config.chunkSize, i * config.chunkSize, trxs)
    // 找出負責老師
    const teachers = await findTeachersByIds(Array.from(new Set(students.map(s => s.teacherId))).filter(s => !!s) as number[], trxs)
    const teacherMap = keyBy(teachers, 'id')

    // 轉移學生
    for (const s of students) {
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

      try {
        // 新建老師與學生的聊天室
        await createRooms([{
          id: chatRoomId,
          name: '',
          type: 'teachers-to-student',
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
      } catch (e) {
        console.log(`聊天室已存在 studentId = ${studentId}, chatRoomId = ${chatRoomId}`);
      }
    }
  }
}
