import generateUUID from "@/utils/generateUUID"
import {Site} from "@/types/Site";

export default (prefix: string, phone: string, site: Site): string => {
  return generateUUID(`${prefix}_${phone}_${site.organizationId}`)
}
