import generateUUID from "../utils/generateUUID.js"

export default (v2ScoreId: string): string => {
  return generateUUID(v2ScoreId)
}
