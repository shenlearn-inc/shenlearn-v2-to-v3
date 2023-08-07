import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toSchoolId from "../utils/toSchoolId.js";
import {findTeacherById} from "../v2models/teachers.js";
import toTeacherId from "../utils/toTeacherId.js";
import v2db from "../db/v2db.js";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";
import camelcaseKeys from "camelcase-keys";
import {findAllCourseDiaries} from "../v2models/courseDiaries.js";
import {findCoursesByIds} from "../v2models/courses.js";
import toClazzId from "../utils/toClazzId.js";
import toClazzDiaryId from "../utils/toClazzDiaryId.js";
import {ClazzDiaryV3, createClazzDiaries} from "../v3models/clazzDiaries.js";
import toValidDateObj from "../utils/toValidDateObj.js";

export default async (trxs: Trxs) => {
  console.info('轉移班級日誌')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得日誌
  const courseDiaries = await findAllCourseDiaries(trxs);
  if (!courseDiaries.length) {
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
  const clazzDiaries = [] as any;
  for (const courseDiary of courseDiaries) {
    const hashedId = courseDiary.hashedId + "00000";
    const clazzDiaryId = toClazzDiaryId(hashedId);
    await v2db().from("course_diaries").update({ hashed_id: clazzDiaryId }).where({ id: courseDiary.id }).transacting(trxs.v2db)

    // 班級
    const [course] = await findCoursesByIds([courseDiary.courseId], trxs);
    if (!course?.hashedId) continue;
    const clazzId = toClazzId(course.hashedId);

    // 老師
    const teacherV2 = await findTeacherById(courseDiary.teacherId, trxs);
    let teacherId = ""
    if (teacherV2?.hashedId) {
      teacherId = toTeacherId(teacherV2.hashedId);
    } else {
      teacherId = serviceDirector.id;
    }

    // 圖片
    const images = camelcaseKeys(await v2db()
      .select()
      .from("course_diary_images")
      .where("course_diary_id", courseDiary.id)
      .whereNull("deleted_at")
      .transacting(trxs.v2db))

    clazzDiaries.push({
      id: clazzDiaryId,
      clazzId,
      teacherId,
      schoolId: toSchoolId(siteInfoV2.hashedId),
      payload: {
        images: images.map((i, index) => ({
          url: i.url,
          size: 16 * 1024,
          order: index,
        })),
        content: {
          en: courseDiary.content,
        },
        heading: {
          en: courseDiary.title,
        }
      },
      isPublished: !!courseDiary.isPublic,
      createdAt: toValidDateObj(courseDiary.createdAt) ?? new Date(),
      updatedAt: toValidDateObj(courseDiary.updatedAt) ?? new Date(),
      deletedAt: toValidDateObj(courseDiary.deletedAt),
    } as ClazzDiaryV3)
  }
  await createClazzDiaries(clazzDiaries, trxs);
}
