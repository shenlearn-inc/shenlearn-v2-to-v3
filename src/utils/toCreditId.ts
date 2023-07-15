import generateUUID from "../utils/generateUUID.js"

export default (v2CreditId: string): string => {
  return generateUUID(v2CreditId)
}
