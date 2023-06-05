import moment from "moment";

export default (date: Date | null): Date | null => {
  if (date?.toString() === "0000-00-00 00:00:00") {
    return new Date()
  }
  try {
    date?.toISOString()
  } catch (e) {
    return moment(date).toDate();
  }
  return date ?? null
};
