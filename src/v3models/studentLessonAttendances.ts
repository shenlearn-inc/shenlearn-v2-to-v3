import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js";

export interface StudentLessonAttendanceV3 {
  id: string
  schoolId: string
  clazzId: string
  lessonId: string
  studentId: string
  studentSchoolAttendanceId: string | null
  attendAt: Date | null
  leaveAt: Date | null
  remark: string
  teacherId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createStudentLessonAttendances = async (studentLessonAttendances: StudentLessonAttendanceV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(studentLessonAttendances))
    .from('student_lesson_attendances')
    .transacting(trxs.v3db)

  await query
  return
}
