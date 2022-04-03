import generateUUID from "@/utils/generateUUID"

export default (v2SiteInfoHashedId: string): string => {
  return generateUUID(v2SiteInfoHashedId)
}
