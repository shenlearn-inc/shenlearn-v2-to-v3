import generateUUID from "@/utils/generateUUID"

export default (v2CourseCategoryHashedId: string): string => {
  return generateUUID(v2CourseCategoryHashedId)
}
