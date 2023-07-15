import generateUUID from "../utils/generateUUID.js"

export default (v2InclassCourseHashedId: string): string => {
  return generateUUID(v2InclassCourseHashedId)
}
