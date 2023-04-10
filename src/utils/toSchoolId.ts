import generateUUID from "@/utils/generateUUID"
import config from "@/config"

export default (v2SiteInfoHashedId: string): string => {
  const schoolId = (config as any).schoolId
  return schoolId ?? generateUUID(v2SiteInfoHashedId)
}
