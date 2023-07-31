export default (date: Date | null | any): string | null => {
  try {
    if (date == "0000-00-00 00:00:00") {
      return null;
    }
    return date?.toISOString().slice(0, 10) ?? null
  } catch (e) {
    return null
  }
};
