import generateUUID from "../utils/generateUUID.js"

export default (v2StudentDiaryId: string): string => {
  return generateUUID(v2StudentDiaryId)
}
