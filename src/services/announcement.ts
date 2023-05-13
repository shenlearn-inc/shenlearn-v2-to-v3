import {Trxs} from "@/types/Trxs";
import {findAllInclassCourses, getNumberOfInclassCourse} from "@/v2models/inclassCourses";
import config from "@/config";
import {createLessons} from "@/v3models/lessons";
import generateUUID from "@/utils/generateUUID";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findCoursesByIds} from "@/v2models/courses";
import {keyBy} from "lodash"
import toClazzId from "@/utils/toClazzId";
import {findTeacherById, findTeachersByIds, TeacherV2} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import v2db from "@/db/v2db";
import {findAllNotifications} from "@/v2models/notifications";
import toAnnouncementId from "@/utils/toAnnouncementId";
import v3db from "@/db/v3db";
import {TeacherV3} from "@/v3models/teachers";
import {AnnouncementV3, createAnnouncements} from "@/v3models/announcements";
import camelcaseKeys from "camelcase-keys";
import {findStudentsByIds} from "@/v2models/students";
import toStudentId from "@/utils/toStudentId";
import {AnnouncementStudentRefV3, createAnnouncementStudentRefs} from "@/v3models/announcementStudentRefs";

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
    .transacting(trxs.v3db) as TeacherV3

  // 轉移班級通知
  for (const notification of notifications) {
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
      createdAt: notification.createdAt,
      publishedAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      deletedAt: notification.deletedAt,
    }
    await createAnnouncements([announcement as any], trxs);
  }
}
