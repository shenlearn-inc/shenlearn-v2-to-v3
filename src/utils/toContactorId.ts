import generateUUID from "../utils/generateUUID.js"
import {Site} from "../types/Site.js";

export default (prefix: string, phone: string, site: Site): string => {
  return generateUUID(`${prefix}_${phone}_${site.organizationId}`)
}
