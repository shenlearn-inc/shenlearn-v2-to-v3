export default (v2SignMode: 'sign-and-inclass' | 'sign-not-inclass' | null): 'auto' | 'manual' => {
  switch (v2SignMode) {
    case 'sign-and-inclass':
      return 'auto'
    case 'sign-not-inclass':
      return 'manual'
  }
  return 'auto'
}
