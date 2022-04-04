import generateUUID from "@/utils/generateUUID"

export default (studentId: string, clazzId: string, type: 'leave' | 'makeup' | 'substitute' | 'in' | 'out', date: string): string => {
  return generateUUID(`${studentId}:${clazzId}:${type}:${date}`)
}
