import generateUUID from "@/utils/generateUUID"

export default (v2InclassCourseHashedId: string): string => {
  return generateUUID(v2InclassCourseHashedId)
}
