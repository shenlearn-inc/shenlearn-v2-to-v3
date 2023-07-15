import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface StudentSchoolAttendanceV3 {
  id: string
  studentId: string
  schoolId: string
  startedAt: Date
  starterId: string | null
  starterType: string | null
  endedAt: Date | null
  enderId: string | null
  enderType: 'teacher' | 'system' | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createStudentSchoolAttendances = async (studentSchoolAttendances: StudentSchoolAttendanceV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(studentSchoolAttendances))
    .from('student_school_attendances')
    .transacting(trxs.v3db)

  await query
  return
}
