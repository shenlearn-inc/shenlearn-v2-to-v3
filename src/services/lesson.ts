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
import {findTeachersByIds} from "@/v2models/teachers";
import toTeacherId from "@/utils/toTeacherId";

export default async (trxs: Trxs) => {
  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  const numberOfInclassCourse = await getNumberOfInclassCourse(trxs)
  for (let i = 0; i < Math.ceil(numberOfInclassCourse / config.chunkSize); i++) {

    // 找出課堂
    const inclassCourses = await findAllInclassCourses(config.chunkSize, i * config.chunkSize, trxs)

    const v2Courses = await findCoursesByIds(inclassCourses.map(c => c.courseId), trxs)
    const v2CourseMap = keyBy(v2Courses, 'id')

    const v2Teachers = await findTeachersByIds(inclassCourses.map(c => c.teacherId), trxs)
    const v2TeacherMap = keyBy(v2Teachers, 'id')

    // 轉移課堂
    await createLessons(
      inclassCourses.map(c => {
        return {
          id: generateUUID(c.hashedId),
          schoolId: toSchoolId(siteInfoV2.hashedId),
          clazzId: toClazzId(v2CourseMap[c.courseId].hashedId),
          name: '',
          startAt: c.inclassAt ?? null,
          endAt: c.outclassAt ?? null,
          teacherId: toTeacherId(v2TeacherMap[c.teacherId].hashedId),
          createdAt: c.createdAt ?? new Date(),
          updatedAt: c.updatedAt ?? new Date(),
          deletedAt: c.deletedAt,
        }
      }),
      trxs,
    )
  }
}
