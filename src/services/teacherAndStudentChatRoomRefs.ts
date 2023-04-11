import {Trxs} from "@/types/Trxs";
import v3db from "@/db/v3db";
import v2db from "@/db/v2db";
import {TeacherV2} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import {createRoomUserRefs} from "@/v3chatModels/roomUserRefs";
import generateUUID from "@/utils/generateUUID";
import {differenceWith, keyBy} from 'lodash'
import {StudentV3} from "@/v3models/students";
import {SubContactorV3} from "@/v3models/subContactors";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import camelcaseKeys from "camelcase-keys";

export default async (trxs: Trxs) => {
  console.info('轉移老師與學生聊天室關係')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 找出老師
  const v2Teachers = camelcaseKeys(
    await v2db()
    .select()
    .from('teachers')
    .whereNull('deleted_at')
    .where('status', true)
  ) as TeacherV2[]
  if (!v2Teachers.length) return

  // 處理主任
  const students = camelcaseKeys(
    await v3db()
      .select()
      .from('students')
      .where('school_id', schoolId)
      .whereNull('deleted_at')
      .transacting(trxs.v3db)
  )
  const studentMap = keyBy(students, 'id')
  const subContactors = students.length
    ? camelcaseKeys(
      await v3db()
        .select()
        .from('sub_contactors')
        .whereIn('student_id', Array.from(new Set(students.map(r => r.id))))
        .transacting(trxs.v3db)
    ) as SubContactorV3[]
    : []
  if (students.length || subContactors.length) {
    for (const v2Teacher of v2Teachers.filter(t => t.position === 'director')) {
      // 加入學生主聊天室
      await createRoomUserRefs(
        students.map(s => {
          return {
            id: generateUUID(),
            roomId: s.chatRoomId,
            roomName: s.name,
            roomSubName: `ALL`,
            roomAvatarUrl: s.avatarUrl,
            userId: toTeacherId(v2Teacher.hashedId),
            userName: v2Teacher.name ?? '',
            userAvatarUrl: null,
            unread: 0,
            lastSeenAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          }
        }),
        trxs,
      )

      // 加入學生家長聊天室
      await createRoomUserRefs(
        subContactors.map(sc => {
          return {
            id: generateUUID(),
            roomId: sc.chatRoomId,
            roomName: studentMap[sc.studentId].name,
            roomSubName: sc.relationship,
            roomAvatarUrl: studentMap[sc.studentId].avatarUrl,
            userId: toTeacherId(v2Teacher.hashedId),
            userName: v2Teacher.name ?? '',
            userAvatarUrl: null,
            unread: 0,
            lastSeenAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          }
        }),
        trxs,
      )
    }
  }

  // 處理行政與老師
  for (const v2Teacher of v2Teachers.filter(t => t.position === 'manager' || t.position === 'teacher')) {
    const refs = (await v3db()
      .select({
        studentId: 'clazz_student_refs.student_id',
        teacherId: 'clazz_teacher_refs.teacher_id',
      })
      .from('clazz_teacher_refs')
      .leftJoin('clazzes', 'clazz_teacher_refs.clazz_id', 'clazzes.id')
      .leftJoin('clazz_student_refs', 'clazzes.id', 'clazz_student_refs.clazz_id')
      .leftJoin('students', 'clazz_student_refs.student_id', 'students.id')
      .where('clazz_teacher_refs.teacher_id', toTeacherId(v2Teacher.hashedId))
      .whereNull('clazz_teacher_refs.deleted_at')
      .whereNull('clazzes.deleted_at')
      .where('clazzes.is_active', true)
      .whereNull('clazz_student_refs.deleted_at')
      .whereNull('students.deleted_at')
      .transacting(trxs.v3db)).filter(r => !!r && !!r.studentId && !!r.teacherId) as { studentId: string; teacherId: string }[]

    if (!refs?.length) {
      continue;
    }

    // 加入學生主聊天室
    const students = camelcaseKeys(
      (await v3db()
        .select()
        .from('students')
        .whereIn('id', Array.from(new Set(refs.map(r => r.studentId))))
        .transacting(trxs.v3db))
    ) as StudentV3[]
    const studentMap = keyBy(students, 'id')

    await createRoomUserRefs(
      refs.map(r => {
        return {
          id: generateUUID(),
          roomId: studentMap[r.studentId].chatRoomId,
          roomName: studentMap[r.studentId].name,
          roomSubName: `ALL`,
          roomAvatarUrl: studentMap[r.studentId].avatarUrl,
          userId: r.teacherId,
          userName: v2Teacher.name ?? '',
          userAvatarUrl: null,
          unread: 0,
          lastSeenAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }
      }),
      trxs,
    )

    // 加入學生家長聊天室
    const subContactors = camelcaseKeys(
      await v3db()
        .select()
        .from('sub_contactors')
        .whereIn('sub_contactors.student_id', Array.from(new Set(refs.map(r => r.studentId))))
        .transacting(trxs.v3db)
    ) as SubContactorV3[]
    await createRoomUserRefs(
      subContactors.map(sc => {
        return {
          id: generateUUID(),
          roomId: sc.chatRoomId,
          roomName: studentMap[sc.studentId].name,
          roomSubName: sc.relationship,
          roomAvatarUrl: studentMap[sc.studentId].avatarUrl,
          userId: toTeacherId(v2Teacher.hashedId),
          userName: v2Teacher.name ?? '',
          userAvatarUrl: null,
          unread: 0,
          lastSeenAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        }
      }),
      trxs,
    )
  }
}
