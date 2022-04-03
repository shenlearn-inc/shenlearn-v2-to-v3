import moment from "moment";

export default (weekday: string): string => {
  return moment().day(weekday).format('YYYY-MM-DD')
}
