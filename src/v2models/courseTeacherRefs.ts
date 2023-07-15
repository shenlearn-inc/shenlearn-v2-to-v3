import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface CourseTeacherRefV2 {
  id: number
  courseId: number
  teacherId: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllCourseTeacherRefs = async (trxs: Trxs): Promise<CourseTeacherRefV2[]> => {
  const query = v2db()
    .select()
    .from('course_teacher_refs')
    .groupBy(['teacher_id', 'course_id', 'deleted_at'])
    .transacting(trxs.v2db)

  return camelcaseKeys(await query as any)
}

export const getNumberOfCourseTeacherRef = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from(
      v2db()
        .select()
        .from('course_teacher_refs')
        .groupBy(['teacher_id', 'course_id', 'deleted_at'])
        .as('t')
    )
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
