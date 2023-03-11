export default (date: Date | null): string | null => {
  try {
    return date?.toISOString().slice(0, 10) ?? null
  } catch (e) {
    return null
  }
};
