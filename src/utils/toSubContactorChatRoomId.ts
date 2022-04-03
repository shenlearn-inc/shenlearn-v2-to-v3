import generateUUID from "@/utils/generateUUID"

export default (v2StudentParentHashedId: string): string => {
  return generateUUID(`${v2StudentParentHashedId}_teachers-to-sub-contactor`)
}
