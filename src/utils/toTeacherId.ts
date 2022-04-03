import generateUUID from "@/utils/generateUUID"

export default (v2TeacherHashedId: string): string => {
  return generateUUID(v2TeacherHashedId)
}
