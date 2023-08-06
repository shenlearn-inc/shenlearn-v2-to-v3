import {Trxs} from "../types/Trxs.js";
import {findAllExams} from "../v2models/exams.js";
import generateUUID from "../utils/generateUUID.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toSchoolId from "../utils/toSchoolId.js";
import {findCoursesByIds} from "../v2models/courses.js";
import _ from "lodash"
import toClazzId from "../utils/toClazzId.js";
import {findTeachersByIds} from "../v2models/teachers.js";
import toTeacherId from "../utils/toTeacherId.js";
import {createExams} from "../v3models/exams.js";
import {findStudentsByIds, StudentV2} from "../v2models/students.js";
import {findScoresByExamId} from "../v2models/scores.js";
import toStudentId from "../utils/toStudentId.js";
import {createScores} from "../v3models/scores.js";
import toScoreId from "../utils/toScoreId.js";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";
import toValidDateObj from "../utils/toValidDateObj.js";

export default async (trxs: Trxs) => {
  console.info('轉移考試資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  // 找出考試
  const exams = await findAllExams(Number.MAX_SAFE_INTEGER, 0, trxs)

  const v2Courses = await findCoursesByIds(exams.map(c => c.courseId), trxs)
  const v2CourseMap = _.keyBy(v2Courses, 'id')

  const v2Teachers = await findTeachersByIds(exams.map(c => c.teacherId), trxs)
  const v2TeacherMap = _.keyBy(v2Teachers, 'id')

  for (const exam of exams) {
    const examId = generateUUID(exam.hashedId + "00000")
    await createExams(
      [{
        id: examId,
        name: exam.name,
        schoolId: toSchoolId(siteInfoV2.hashedId),
        clazzId: toClazzId(v2CourseMap[exam.courseId].hashedId),
        teacherId: exam.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[exam.teacherId].hashedId) : serviceDirector.id,
        remark: exam.remark ?? "",
        createdAt: toValidDateObj(exam.createdAt) ?? new Date(),
        updatedAt: toValidDateObj(exam.updatedAt) ?? new Date(),
        deletedAt: toValidDateObj(exam.deletedAt),
      }],
      trxs,
    )

    // 找出成績
    const v2Scores = await findScoresByExamId(exam.id, trxs);

    // 找出學生
    const v2Students = await findStudentsByIds(Array.from(new Set(v2Scores.map(s => s.studentId))), trxs) as StudentV2[]
    const v2StudentMap = _.keyBy(v2Students, 'id')

    // 建立成績
    await createScores(
      v2Scores.filter(s => s.studentId in v2StudentMap).map(s => {
        const id = toScoreId(s.hashedId + "00000")
        const studentId = toStudentId(v2StudentMap[s.studentId].hashedId)

        return {
          id,
          examId,
          studentId,
          score: s.score,
          remark: "",
          createdAt: toValidDateObj(s.createdAt) ?? new Date(),
          updatedAt: toValidDateObj(s.updatedAt) ?? new Date(),
          deletedAt: toValidDateObj(s.deletedAt),
        }
      }),
      trxs,
    )
  }
}
