import {Trxs} from "@/types/Trxs";
import v2db from "@/db/v2db";
import camelcaseKeys from "camelcase-keys";

export interface StudentAttendanceV2 {
  id: number
  hashedId: string
  studentId: number
  courseId: number
  inclassCourseId: number | null
  teacherId: number
  remark: string | null
  attendedAt: Date | null
  leftAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllNotAttendedStudentAttendances = async (limit: number, offset: number, trxs: Trxs): Promise<StudentAttendanceV2[]> => {
  const query = v2db()
    .select()
    .from('student_attendances')
    .whereNull('attended_at')
    .whereNull('left_at')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfNotAttendedStudentAttendance = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('student_attendances')
    .whereNull('attended_at')
    .whereNull('left_at')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
