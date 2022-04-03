import {Trxs} from "@/types/Trxs";
import v3db from "@/db/v3db";
import v2db from "@/db/v2db";
import {TeacherV2} from "@/v2models/teachers";

export default async (trxs: Trxs) => {
  // 找出老師
  const v2Teachers = await v2db()
    .select()
    .from('teachers')
    .whereNull('deleted_at')
    .where('status', true)
    .transacting(trxs.v2db) as TeacherV2[]
  if (!v2Teachers.length) return


  // 處理主任老師
  for (const v2Teacher of v2Teachers.filter(t => t.position === 'director')) {
    await v3db()
      .select({
        studentId: 'clazz_student_refs.student_id',
        teacherId: 'clazz_teacher_refs.teacher_id',
      })
      .from('clazz_teacher_refs')
      .leftJoin('clazzes', 'clazz_teacher_refs.clazz_id', 'clazzes.id')
      .whereNull('clazz_teacher_refs.deleted_at')
      .whereNull('clazzes.deleted_at')
      .where('clazzes.is_active', true)
  }
}
