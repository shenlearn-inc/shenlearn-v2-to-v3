export interface StudentSignV2 {
  id: number
  hashedId: string
  studentId: number | null
  status: boolean | null
  teacherId: number | null
  temperature: number | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}
