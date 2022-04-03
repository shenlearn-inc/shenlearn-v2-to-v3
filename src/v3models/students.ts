import v3db from "@/db/v3db"
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "@/types/Trxs";

export interface StudentV3 {
  id: string
  username: string
  password: string | null
  salt: string | null
  accessToken: string | null
  refreshToken: string | null
  schoolId: string
  roleId: string
  name: string
  no: string
  avatarUrl: string | null
  status: 'pending' | 'active' | 'inactive'
  cardNo: string | null
  dateOfBirth: string | null
  cellphonePrefix: string | null
  cellphone: string | null
  telephonePrefix: string | null
  telephone: string | null
  email: string | null
  address: string
  alias: string
  schoolName: string
  gradeNo: number | null
  dateOfEnroll: string | null
  enrollmentMethod: string
  highestDegreeEarned: string
  remark: string
  advisorId: string | null
  isInSchool: boolean
  chatRoomId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createStudents = async (students: StudentV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(students))
    .from('students')
    .transacting(trxs.v3db)

  await query
  return
}
