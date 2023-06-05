export default (date: Date | null): Date | null => {
  if (date?.toString() === "0000-00-00 00:00:00") {
    return new Date()
  }
  return date ?? null
};
