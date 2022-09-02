import generateUUID from "@/utils/generateUUID"

export default (v2CreditId: string): string => {
  return generateUUID(v2CreditId)
}
