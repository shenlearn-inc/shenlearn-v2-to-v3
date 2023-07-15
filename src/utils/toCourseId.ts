import generateUUID from "../utils/generateUUID.js"

export default (v2CourseCategoryHashedId: string): string => {
  return generateUUID(v2CourseCategoryHashedId)
}
