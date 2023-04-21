import generateUUID from "@/utils/generateUUID"

export default (v2CourseDiaryHashedId: string): string => {
  return generateUUID(v2CourseDiaryHashedId)
}
