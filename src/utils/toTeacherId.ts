import generateUUID from "../utils/generateUUID.js"

export default (v2TeacherHashedId: string): string => {
  return generateUUID(v2TeacherHashedId)
}
