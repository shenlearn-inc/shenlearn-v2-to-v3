import v2db from "@/db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface StudentScheduleV2 {
  id: number
  hashedId: string
  courseId: number
  studentId: number
  teacherId: number
  event: 'absent' | 'makeup' | 'substitute' | 'join' | 'leave'
  handleAt: Date
  handleTeacherId: number | null
  status: number | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findAllStudentSchedules = async (limit: number, offset: number, trxs: Trxs): Promise<StudentScheduleV2[]> => {
  const query = v2db()
    .select()
    .from('student_schedules')
    .limit(limit ?? Number.MAX_SAFE_INTEGER)
    .offset(offset ?? 0)
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}

export const getNumberOfStudentSchedule = async (trxs: Trxs): Promise<number> => {
  const query = v2db()
    .count()
    .from('student_schedules')
    .transacting(trxs.v2db)

  const result = await query

  return result[0]['count(*)'] as number
}
