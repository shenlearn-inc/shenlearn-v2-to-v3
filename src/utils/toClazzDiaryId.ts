import generateUUID from "../utils/generateUUID.js"

export default (v2CourseDiaryHashedId: string): string => {
  return generateUUID(v2CourseDiaryHashedId)
}
