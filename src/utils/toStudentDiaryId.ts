import generateUUID from "@/utils/generateUUID"

export default (v2StudentDiaryId: string): string => {
  return generateUUID(v2StudentDiaryId)
}
