import {findSiteInfo} from "@/v2models/siteInfo"
import toSchoolId from "@/utils/toSchoolId";
import {findAllCourses} from "@/v2models/courses";
import toClazzId from "@/utils/toClazzId";
import {createClazzes} from "@/v3models/clazzes";
import {findCourseCategoriesByIds} from "@/v2models/courseCategories";
import {keyBy} from "lodash"
import toCourseId from "@/utils/toCourseId";
import toAttendMode from "@/utils/toAttendMode";
import {findInitCourse} from "@/v3models/courses";
import {Trxs} from "@/types/Trxs";
import {findAllCourseTimes} from "@/v2models/courseTimes";
import {createClazzTimes} from "@/v3models/clazzTimes";
import generateUUID from "@/utils/generateUUID";
import weekdayToDate from "@/utils/weekdayToDate";
import v3db from "@/db/v3db";
import v2db from "@/db/v2db";
import config from "@/config";

export default async (trxs: Trxs) => {
  console.info('轉移班級資料')

  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得舊班級
  const v2Courses = await findAllCourses(99999, 0, trxs)
  if (!v2Courses.length) return

  // 取得課種
  const v2CourseCategories = await findCourseCategoriesByIds(Array.from(new Set(v2Courses.map(c => c.courseCategoryId))), trxs)
  const courseCategoryMap = keyBy(v2CourseCategories, 'id')

  // 取得初始課種
  const initCourse = await findInitCourse(trxs)

  // 轉換班級
  if (config.isHandleDuplicateHashedId) {
    for (let i = 0; i < v2Courses.length; i++) {
      const c = v2Courses[i];
      const isExisted = await v3db().first().from("clazzes").where("id", toClazzId(c.hashedId)).transacting(trxs.v3db)
      if (isExisted) {
        // 產出新 hashedId
        const newHashedId = c.hashedId + "00000";
        await v2db().from("courses").update({ hashed_id: newHashedId }).where({ id: c.id }).transacting(trxs.v2db)
        v2Courses[i].hashedId = newHashedId
      }

      await createClazzes([
        {
          id: toClazzId(v2Courses[i].hashedId),
          name: c.name ?? '',
          schoolId: toSchoolId(siteInfoV2.hashedId),
          courseId: c.courseCategoryId in courseCategoryMap ? toCourseId(courseCategoryMap[c.courseCategoryId].hashedId) : initCourse!.id,
          attendMethod: toAttendMode(siteInfoV2.signMode),
          remark: c.remark ?? '',
          isActive: !!c.status,
          isStarted: !!c.inclass,
          createdAt: c.createdAt ?? new Date(),
          updatedAt: c.updatedAt ?? new Date(),
          deletedAt: c.deletedAt,
        }
      ], trxs)
    }
  } else {
    await createClazzes(v2Courses.map(c => {
      return {
        id: toClazzId(c.hashedId),
        name: c.name ?? '',
        schoolId: toSchoolId(siteInfoV2.hashedId),
        courseId: c.courseCategoryId in courseCategoryMap ? toCourseId(courseCategoryMap[c.courseCategoryId].hashedId) : initCourse!.id,
        attendMethod: toAttendMode(siteInfoV2.signMode),
        remark: c.remark ?? '',
        isActive: !!c.status,
        isStarted: !!c.inclass,
        createdAt: c.createdAt ?? new Date(),
        updatedAt: c.updatedAt ?? new Date(),
        deletedAt: c.deletedAt,
      }
    }), trxs)
  }

  // 轉換班級時間
  const v2CourseTimes = await findAllCourseTimes(99999, 0, trxs)
  if (!v2CourseTimes.length) return

  const v2CourseMap = keyBy(v2Courses, 'id')
  if (config.isHandleDuplicateHashedId) {
    for (let i = 0; i < v2CourseTimes.length; i++) {
      const ct = v2CourseTimes[i];
      const date = weekdayToDate(ct.weekday)
      const isExisted = await v3db().first().from("clazz_times").where("id", generateUUID(ct.hashedId)).transacting(trxs.v3db)
      if (isExisted) {
        // 產出新 hashedId
        const newHashedId = ct.hashedId + "00000";
        await v2db().from("course_times").update({ hashed_id: newHashedId }).where({ id: ct.id }).transacting(trxs.v2db)
        v2CourseTimes[i].hashedId = newHashedId
      }
      await createClazzTimes([
        {
          id: generateUUID(v2CourseTimes[i].hashedId),
          clazzId: toClazzId(v2CourseMap[ct.courseId].hashedId),
          schoolId: toSchoolId(siteInfoV2.hashedId),
          name: '',
          startDate: date,
          startTime: ct.startedAt,
          endDate: date,
          endTime: ct.endedAt,
          untilDate: null,
          untilTime: null,
          repeat: "everyweek",
          counter: 0,
          createdAt: ct.createdAt ?? new Date(),
          updatedAt: ct.updatedAt ?? new Date(),
          deletedAt: ct.deletedAt,
        }
      ], trxs)
    }
  } else {
    await createClazzTimes(v2CourseTimes.map(ct => {
      const date = weekdayToDate(ct.weekday)
      return {
        id: generateUUID(config.isHandleDuplicateHashedId ? `${ct.hashedId}00000` : ct.hashedId),
        clazzId: toClazzId(v2CourseMap[ct.courseId].hashedId),
        schoolId: toSchoolId(siteInfoV2.hashedId),
        name: '',
        startDate: date,
        startTime: ct.startedAt,
        endDate: date,
        endTime: ct.endedAt,
        untilDate: null,
        untilTime: null,
        repeat: "everyweek",
        counter: 0,
        createdAt: ct.createdAt ?? new Date(),
        updatedAt: ct.updatedAt ?? new Date(),
        deletedAt: ct.deletedAt,
      }
    }), trxs)
  }
}
