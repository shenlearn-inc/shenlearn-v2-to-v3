export default (date: Date | null): string | null => {
  return date?.toISOString().slice(0, 10) ?? null
};
