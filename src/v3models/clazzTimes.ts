import v3db from "../db/v3db.js"
import snakecaseKeys from "snakecase-keys"
import {Trxs} from "../types/Trxs.js"

export interface ClazzTimeV3 {
  id: string
  clazzId: string
  schoolId: string
  name: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  untilDate: string | null
  untilTime: string | null
  repeat: 'never' | 'everyday' | 'everyweek' | 'everytwoweek' | 'everymonth'
  counter: number
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const createClazzTimes = async (clazzTimes: ClazzTimeV3[], trxs: Trxs): Promise<void> => {
  const query = v3db()
    .insert(snakecaseKeys(clazzTimes))
    .from('clazz_times')
    .transacting(trxs.v3db)

  await query
  return
}
