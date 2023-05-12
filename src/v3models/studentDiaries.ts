import v3db from "@/db/v3db"
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "@/types/Trxs";

export interface StudentDiaryV3 {
  id: string;
  schoolId: string;
  lessonId: string | null;
  teacherId: string;
  studentId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const createStudentDiaries = async (studentDiaries: StudentDiaryV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(studentDiaries))
    .from('student_diaries')
    .transacting(trxs.v3db)

  await query
  return
}
