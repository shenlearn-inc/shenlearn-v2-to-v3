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

export default async (trxs: Trxs) => {
  console.info('轉移考試資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  const serviceDirector = await v2db()
    .first()
    .from('teachers')
    .where('name', 'Service')
    .orWhere('email', 'service@shenlearn.com') as TeacherV2

  // 找出考試
  const exams = await findAllExams(Number.MAX_SAFE_INTEGER, 0, trxs)

  const v2Courses = await findCoursesByIds(exams.map(c => c.courseId), trxs)
  const v2CourseMap = keyBy(v2Courses, 'id')

  const v2Teachers = await findTeachersByIds(exams.map(c => c.teacherId), trxs)
  const v2TeacherMap = keyBy(v2Teachers, 'id')

  for (const exam of exams) {
    const examId = generateUUID(exam.hashedId)
    await createExams(
      [{
        id: examId,
        name: exam.name,
        schoolId: toSchoolId(siteInfoV2.hashedId),
        clazzId: toClazzId(v2CourseMap[exam.courseId].hashedId),
        teacherId: exam.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[exam.teacherId].hashedId) : toTeacherId(serviceDirector.hashedId),
        remark: exam.remark ?? "",
        createdAt: exam.createdAt ?? new Date(),
        updatedAt: exam.updatedAt ?? new Date(),
        deletedAt: exam.deletedAt,
      }],
      trxs,
    )

    // 找出成績
    const v2Scores = await findScoresByExamId(exam.id, trxs);

    // 找出學生
    const v2Students = await findStudentsByIds(Array.from(new Set(v2Scores.map(s => s.studentId))), trxs) as StudentV2[]
    const v2StudentMap = keyBy(v2Students, 'id')

    // 建立成績
    await createScores(
      v2Scores.map(s => {
        const id = toScoreId(s.hashedId)
        const studentId = toStudentId(v2StudentMap[s.studentId].hashedId)

        return {
          id,
          examId,
          studentId,
          score: s.score,
          remark: "",
          createdAt: s.createdAt ?? new Date(),
          updatedAt: s.updatedAt ?? new Date(),
          deletedAt: s.deletedAt,
        }
      }),
      trxs,
    )
  }
}
