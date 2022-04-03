export default (grade: string | null): number | null => {
  if (!grade) return null
  switch (grade) {
    case 'first':
      return 1
    case 'second':
      return 2
    case 'third':
      return 3
    case 'fourth':
      return 4
    case 'fifth':
      return 5
    case 'sixth':
      return 6
    case 'seventh':
      return 7
    case 'eighth':
      return 8
    case 'ninth':
      return 9
    case 'tenth':
      return 10
    case 'eleventh':
      return 11
    case 'twelfth':
      return 12
    case 'fresh':
      return 13
    case 'sophomore':
      return 14
    case 'junior':
      return 15
    case 'senior':
      return 16
  }
  return null
}
