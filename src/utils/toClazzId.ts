import generateUUID from "../utils/generateUUID.js"

export default (v2CourseId: string): string => {
  return generateUUID(v2CourseId)
}
