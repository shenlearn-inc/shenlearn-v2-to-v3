import generateUUID from "@/utils/generateUUID"

export default (v2NotificationHashId: string): string => {
  return generateUUID(v2NotificationHashId)
}
