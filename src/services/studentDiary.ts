import {Trxs} from "../types/Trxs.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toSchoolId from "../utils/toSchoolId.js";
import _ from "lodash";
import {findTeachersByIds} from "../v2models/teachers.js";
import toTeacherId from "../utils/toTeacherId.js";
import {findStudentsByIds, StudentV2} from "../v2models/students.js";
import toStudentId from "../utils/toStudentId.js";
import {findAllStudentDiaries} from "../v2models/studentDiaries.js";
import {createStudentDiaries} from "../v3models/studentDiaries.js";
import toStudentDiaryId from "../utils/toStudentDiaryId.js";
import {Site} from "../types/Site.js";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移電訪資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  // 找出電訪
  const v2StudentDiaries = await findAllStudentDiaries(Number.MAX_SAFE_INTEGER, 0, trxs)

  // 找出學生
  const v2Students = await findStudentsByIds(Array.from(new Set(v2StudentDiaries.map(s => s.studentId))), trxs) as StudentV2[]
  const v2StudentMap = _.keyBy(v2Students, 'id')

  // 找出老師
  const v2Teachers = await findTeachersByIds(Array.from(new Set(v2StudentDiaries.map(c => c.teacherId))), trxs)
  const v2TeacherMap = _.keyBy(v2Teachers, 'id')

  for (const diary of v2StudentDiaries) {
    // 建立電訪資料
    await createStudentDiaries(
      [{
        id: toStudentDiaryId(site?.isHandleDuplicateHashedId ? `${diary.hashedId}00000` : diary.hashedId),
        schoolId: toSchoolId(siteInfoV2.hashedId),
        lessonId: null,
        teacherId: diary.teacherId in v2TeacherMap ? toTeacherId(v2TeacherMap[diary.teacherId]?.hashedId) : serviceDirector.id,
        studentId: toStudentId(v2StudentMap[diary.studentId].hashedId),
        content: diary.content ?? "",
        createdAt: diary.createdAt ?? new Date(),
        updatedAt: diary.updatedAt ?? new Date(),
        deletedAt: diary.deletedAt,
      }],
      trxs,
    )
  }
}
