import generateUUID from "@/utils/generateUUID"

export default (v2CourseId: string): string => {
  return generateUUID(v2CourseId)
}
