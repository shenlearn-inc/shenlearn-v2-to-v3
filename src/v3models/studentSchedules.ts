import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js"

export interface StudentScheduleV3 {
  id: string
  schoolId: string
  hashedId: string
  studentId: string
  clazzId: string
  type: 'leave' | 'makeup' | 'substitute' | 'in' | 'out'
  date: string
  remark: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createStudentSchedules = async (studentSchedules: StudentScheduleV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(studentSchedules))
    .from('student_schedules')
    .transacting(trxs.v3db)

  await query
  return
}
