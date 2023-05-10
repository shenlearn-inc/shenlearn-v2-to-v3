import generateUUID from "@/utils/generateUUID"

export default (v2ScoreId: string): string => {
  return generateUUID(v2ScoreId)
}
