import generateUUID from "@/utils/generateUUID"

export default (v2StudentHashedId: string): string => {
  return generateUUID(v2StudentHashedId)
}
