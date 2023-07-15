import v2db from "../db/v2db.js"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "../types/Trxs.js";

export interface CourseStudentRefV2 {
  id: number
  courseId: number
  studentId: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllCourseStudentRefs = async (limit: number, offset: number, trxs: Trxs): Promise<CourseStudentRefV2[]> => {
  const query = v2db()
    .select()
    .from('course_student_refs')
    .groupBy(['student_id', 'course_id', 'deleted_at'])
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query as any)
}

export const getNumberOfCourseStudentRef = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from(
      v2db()
        .select()
        .from('course_student_refs')
        .groupBy(['student_id', 'course_id', 'deleted_at'])
        .as('t')
    )
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
