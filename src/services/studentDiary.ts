import {Trxs} from "@/types/Trxs";
import {findAllExams} from "@/v2models/exams";
import generateUUID from "@/utils/generateUUID";
import {findSiteInfo} from "@/v2models/siteInfo";
import toSchoolId from "@/utils/toSchoolId";
import {findCoursesByIds} from "@/v2models/courses";
import {keyBy} from "lodash"
import toClazzId from "@/utils/toClazzId";
import {findTeachersByIds, TeacherV2} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import v2db from "@/db/v2db";
import {createExams} from "@/v3models/exams";
import {findStudentsByIds, StudentV2} from "@/v2models/students";
import {findScoresByExamId} from "@/v2models/scores";
import toStudentId from "@/utils/toStudentId";
import {createScores} from "@/v3models/scores";
import toScoreId from "@/utils/toScoreId";
import {findAllStudentDiaries} from "@/v2models/studentDiaries";
import {createStudentDiaries} from "@/v3models/studentDiaries";
import toStudentDiaryId from "@/utils/toStudentDiaryId";

export default async (trxs: Trxs) => {
  console.info('轉移電訪資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  const serviceDirector = await v2db()
    .first()
    .from('teachers')
    .where('name', 'Service')
    .orWhere('email', 'service@shenlearn.com') as TeacherV2

  // 找出電訪
  const v2StudentDiaries = await findAllStudentDiaries(Number.MAX_SAFE_INTEGER, 0, trxs)

  // 找出學生
  const v2Students = await findStudentsByIds(Array.from(new Set(v2StudentDiaries.map(s => s.studentId))), trxs) as StudentV2[]
  const v2StudentMap = keyBy(v2Students, 'id')

  // 找出老師
  const v2Teachers = await findTeachersByIds(Array.from(new Set(v2StudentDiaries.map(c => c.teacherId))), trxs)
  const v2TeacherMap = keyBy(v2Teachers, 'id')

  const formatted = v2StudentDiaries.map((diary) => {
    return {
      id: toStudentDiaryId(diary.hashedId),
      schoolId: toSchoolId(siteInfoV2.hashedId),
      lessonId: null,
      teacherId: diary.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[diary.teacherId]?.hashedId) : toTeacherId(serviceDirector.hashedId),
      studentId: toStudentId(v2StudentMap[diary.studentId].hashedId),
      content: diary.content ?? "",
      createdAt: diary.createdAt ?? new Date(),
      updatedAt: diary.updatedAt ?? new Date(),
      deletedAt: diary.deletedAt,
    }
  })
  console.log("formatted", formatted)

  if (formatted.length === 0) {
    return;
  }

  // 建立電訪資料
  await createStudentDiaries(
    formatted,
    trxs,
  )
}
