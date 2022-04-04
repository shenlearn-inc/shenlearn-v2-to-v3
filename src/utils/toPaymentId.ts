import generateUUID from "@/utils/generateUUID"

export default (v2PaymentHashedId: string): string => {
  return generateUUID(v2PaymentHashedId)
}
