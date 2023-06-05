import moment from "moment";

export default (date: Date | null): Date | null => {
  if (date?.toString() === "0000-00-00 00:00:00") {
    return new Date()
  }
  if (!moment(date).isValid()) {
    return null;
  }
  if (typeof date === "string") {
    return moment(date).toDate();
  }
  return date ?? null;
};
