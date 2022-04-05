import generateUUID from "@/utils/generateUUID"
import config from "@/config"

export default (v2SiteInfoHashedId: string): string => {
  return config.schoolId ?? generateUUID(v2SiteInfoHashedId)
}
