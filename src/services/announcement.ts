import {Trxs} from "../types/Trxs.js";
import generateUUID from "../utils/generateUUID.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toSchoolId from "../utils/toSchoolId.js";
import {findTeacherById} from "../v2models/teachers.js";
import toTeacherId from "../utils/toTeacherId.js";
import v2db from "../db/v2db.js";
import {findAllNotifications} from "../v2models/notifications.js";
import toAnnouncementId from "../utils/toAnnouncementId.js";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";
import {createAnnouncements} from "../v3models/announcements.js";
import camelcaseKeys from "camelcase-keys";
import {findStudentsByIds} from "../v2models/students.js";
import toStudentId from "../utils/toStudentId.js";
import {createAnnouncementStudentRefs} from "../v3models/announcementStudentRefs.js";

const sendModeToMethod = (sendMode: string) => {
  switch (sendMode) {
    case "sms":
      return "sms";
    case "chat-and-sms":
      return "app-and-sms";
    default:
      return "app";
  }
}

export default async (trxs: Trxs) => {
  console.info('轉移校園公告')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得公告
  const notifications = await findAllNotifications(trxs);
  if (!notifications.length) {
    return;
  }

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  // 轉移班級通知
  for (const notification of notifications) {
    const newHashedId = notification.hashedId + "00000";
    notification.hashedId = newHashedId
    const announcementId = toAnnouncementId(notification.hashedId);

    // 老師
    const teacherV2 = await findTeacherById(notification.teacherId, trxs);
    let teacherId = ""
    if (teacherV2?.hashedId) {
      teacherId = toTeacherId(teacherV2.hashedId);
    } else {
      teacherId = serviceDirector.id;
    }

    // 檔案
    const files = camelcaseKeys(await v2db()
      .select()
      .from("notification_files")
      .where("notification_id", notification.id)
      .whereNull("deleted_at")
      .transacting(trxs.v2db))

    // 圖片
    const images = camelcaseKeys(await v2db()
      .select()
      .from("notification_images")
      .where("notification_id", notification.id)
      .whereNull("deleted_at")
      .transacting(trxs.v2db))

    // 學生關係
    const notificationStudentRefs = camelcaseKeys(await v2db()
      .select()
      .from("notification_student_refs")
      .where("notification_id", notification.id)
      .whereNull("deleted_at")
      .transacting(trxs.v2db))

    if (notificationStudentRefs.length) {
      const students = await findStudentsByIds(Array.from(new Set(notificationStudentRefs.map(ref => ref.studentId))), trxs)
      for (const student of students) {
        await createAnnouncementStudentRefs([{
          id: generateUUID(),
          announcementId,
          studentId: toStudentId(student.hashedId),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: student.deletedAt ? student.deletedAt.toISOString() : null,
        }], trxs);
      }
    }

    const announcement = {
      id: announcementId,
      payload: {
        files: files.map((f, index) => ({
          url: f.url,
          size: 16 * 1024,
          order: index,
        })),
        images: images.map((i, index) => ({
          url: i.url,
          size: 16 * 1024,
          order: index,
        })),
        content: {
          en: notification.content,
        },
        heading: {
          en: "",
        }
      },
      schoolId: toSchoolId(siteInfoV2.hashedId),
      method: sendModeToMethod(notification.sendMode),
      additionalCharge: notification.smsCount ?? 0,
      createdAt: notification?.createdAt ?? new Date(),
      publishedAt: notification?.createdAt ?? new Date(),
      updatedAt: notification?.updatedAt ?? new Date(),
      deletedAt: notification.deletedAt,
    }
    await createAnnouncements([announcement as any], trxs);
  }
}
