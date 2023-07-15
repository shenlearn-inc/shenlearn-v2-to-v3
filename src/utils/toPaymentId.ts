import generateUUID from "../utils/generateUUID.js"

export default (v2PaymentHashedId: string): string => {
  return generateUUID(v2PaymentHashedId)
}
