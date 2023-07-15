import generateUUID from "../utils/generateUUID.js"

export default (v2NotificationHashId: string): string => {
  return generateUUID(v2NotificationHashId)
}
