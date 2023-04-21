import {Trxs} from "@/types/Trxs";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findTeacherById} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import v2db from "@/db/v2db";
import v3db from "@/db/v3db";
import {TeacherV3} from "@/v3models/teachers";
import camelcaseKeys from "camelcase-keys";
import {findAllCourseDiaries} from "@/v2models/courseDiaries";
import {findCoursesByIds} from "@/v2models/courses";
import toClazzId from "@/utils/toClazzId";
import toClazzDiaryId from "@/utils/toClazzDiaryId";
import {ClazzDiaryV3, createClazzDiaries} from "@/v3models/clazzDiaries";

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
    .transacting(trxs.v3db) as TeacherV3

  // 轉移班級通知
  const clazzDiaries = []
  for (const courseDiary of courseDiaries) {
    const clazzDiaryId = toClazzDiaryId(courseDiary.hashedId);

    // 班級
    const [course] = await findCoursesByIds([courseDiary.courseId], trxs);
    const clazzId = toClazzId(course.hashedId);

    // 老師
    const teacherV2 = await findTeacherById(courseDiary.teacherId, trxs);
    let teacherId = ""
    if (teacherV2.hashedId) {
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

    const diary = {
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
      createdAt: courseDiary.createdAt,
      updatedAt: courseDiary.updatedAt,
      deletedAt: courseDiary.deletedAt,
    } as ClazzDiaryV3
    await createClazzDiaries([diary], trxs);
  }
}
