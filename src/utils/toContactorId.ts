import generateUUID from "@/utils/generateUUID"
import config from "@/config";

export default (prefix: string, phone: string): string => {
  return generateUUID(`${prefix}_${phone}_${config.organizationId}`)
}
