import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys"
import camelcaseKeys from "camelcase-keys";
import {Trxs} from "../types/Trxs.js";

export interface CourseV3 {
  id: string
  schoolId: string
  name: string
  remark: string
  type: 'init' | 'normal' | 'credit'
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createCourses = async (courses: CourseV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(courses))
    .from('courses')
    .transacting(trxs.v3db)

  await query
  return
}

export const findInitCourse = async (trxs: Trxs): Promise<CourseV3 | undefined> => {
  const query = v3db()
    .first()
    .from('courses')
    .where('type', 'init')
    .transacting(trxs.v3db)

  return camelcaseKeys(await query)
}

