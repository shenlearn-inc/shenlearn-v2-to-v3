import generateUUID from "../utils/generateUUID.js"

export default (v2StudentHashedId: string): string => {
  return generateUUID(v2StudentHashedId)
}
