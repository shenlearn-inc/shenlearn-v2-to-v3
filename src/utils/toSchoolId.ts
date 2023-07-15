import generateUUID from "../utils/generateUUID.js"
import config from "../config/index.js"

export default (v2SiteInfoHashedId: string): string => {
  const schoolId = (config as any).schoolId
  return schoolId ?? generateUUID(v2SiteInfoHashedId)
}
