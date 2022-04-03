import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface CourseTeacherRefV2 {
  id: number
  courseId: number
  teacherId: number
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllCourseTeacherRefs = async (limit: number, offset: number, trxs: Trxs): Promise<CourseTeacherRefV2[]> => {
  const query = v2db()
    .select()
    .from('course_teacher_refs')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfCourseTeacherRef = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('course_teacher_refs')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
