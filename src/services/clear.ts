import {Trxs} from "@/types/Trxs";
import v3db from "@/db/v3db";
import camelcaseKeys from "camelcase-keys";
import config from "@/config";

export default async (trxs: Trxs) => {

  const schoolId = config.schoolId;

  // 刪除校園通知
  const announcements = camelcaseKeys(await v3db()
    .select()
    .from('announcements')
    .where('school_id', schoolId)
    .transacting(trxs.v3db))
  const announcementIds = Array.from(new Set(announcements.map(a => a.id)))
  await v3db()
    .delete()
    .from('announcement_student_refs')
    .whereIn('announcement_id', announcementIds)
    .transacting(trxs.v3db)
  await v3db()
    .delete()
    .from('announcements')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 刪除 app 登入
  await v3db()
    .delete()
    .from('app_codes')
    .where('organization_id', config.organizationId)
    .transacting(trxs.v3db)

  // 班級
  const clazzes = camelcaseKeys(await v3db()
    .select()
    .from('clazzes')
    .where('school_id', schoolId)
    .transacting(trxs.v3db))
  const clazzIds = Array.from(new Set(clazzes.map(c => c.id)))
  // 刪除班級時間
  await v3db()
    .delete()
    .from('clazz_times')
    .whereIn('clazz_id', clazzIds)
    .transacting(trxs.v3db)
  // 刪除班級學生
  await v3db()
    .delete()
    .from('clazz_student_refs')
    .whereIn('clazz_id', clazzIds)
    .transacting(trxs.v3db)
  await v3db()
    .delete()
    .from('clazz_student_ref_records')
    .whereIn('clazz_id', clazzIds)
    .transacting(trxs.v3db)
  // 刪除班級老師
  await v3db()
    .delete()
    .from('clazz_teacher_refs')
    .whereIn('clazz_id', clazzIds)
    .transacting(trxs.v3db)
  // 刪除班級日誌
  await v3db()
    .delete()
    .from('clazz_diaries')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)
  // 刪除班級
  await v3db()
    .delete()
    .from('clazzes')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 刪除課種
  await v3db()
    .delete()
    .from('courses')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 刪除課堂
  await v3db()
    .delete()
    .from('lessons')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 刪除聯絡人
  await v3db()
    .delete()
    .from('contactors')
    .where('organization_id', config.organizationId)
    .transacting(trxs.v3db)
  // 刪除子聯絡人
  await v3db()
    .delete()
    .from('student_relationships')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 刪除繳費
  await v3db()
    .delete()
    .from('payment_roots')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)
  await v3db()
    .delete()
    .from('payments')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)
  await v3db()
    .delete()
    .from('payment_items')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 刪除收據
  await v3db()
    .delete()
    .from('receipts')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 考試
  const exams = camelcaseKeys(await v3db()
    .select()
    .from('exams')
    .where('school_id', schoolId)
    .transacting(trxs.v3db))
  const examIds = Array.from(new Set(exams.map(e => e.id)))
  // 刪除成績
  await v3db()
    .delete()
    .from('scores')
    .whereIn('exam_id', examIds)
    .transacting(trxs.v3db)
  // 刪除考試
  await v3db()
    .delete()
    .from('exams')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 學生
  const students = camelcaseKeys(await v3db()
    .select()
    .from('students')
    .where('school_id', schoolId)
    .transacting(trxs.v3db))
  const studentIds = Array.from(new Set(students.map(s => s.id)))
  // 刪除學生日誌
  await v3db()
    .delete()
    .from('student_diaries')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)
  // 刪除學生出勤
  await v3db()
    .delete()
    .from('student_lesson_attendances')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)
  await v3db()
    .delete()
    .from('student_school_attendances')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)
  // 刪除學生關係
  await v3db()
    .delete()
    .from('student_relationships')
    .whereIn('student_id', studentIds)
    .transacting(trxs.v3db)
  // 刪除學生排程
  await v3db()
    .delete()
    .from('student_schedules')
    .whereIn('student_id', studentIds)
    .transacting(trxs.v3db)
  // 刪除學生
  await v3db()
    .delete()
    .from('students')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)

  // 刪除老師
  const teachers = camelcaseKeys(await v3db()
    .select()
    .from('teachers')
    .where('school_id', schoolId)
    .transacting(trxs.v3db))
  const teacherIds = Array.from(new Set(teachers.map(t => t.id)))
  // 刪除老師出勤
  await v3db()
    .delete()
    .from('teacher_school_attendances')
    .where('school_id', schoolId)
    .transacting(trxs.v3db)
}
