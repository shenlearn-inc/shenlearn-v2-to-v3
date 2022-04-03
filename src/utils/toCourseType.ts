export default (type: 'unlimited' | 'limited' | null): 'init' | 'normal' | 'credit' => {
  switch (type) {
    case 'unlimited':
      return 'normal'
    case 'limited':
      return 'credit'
  }
  return 'normal'
}
