export default (v2StudentScheduleType: 'absent' | 'makeup' | 'substitute' | 'join' | 'leave'): 'leave' | 'makeup' | 'substitute' | 'in' | 'out' => {
  switch (v2StudentScheduleType) {
    case 'absent':
      return 'leave'
    case 'makeup':
      return 'makeup'
    case 'substitute':
      return 'substitute'
    case 'join':
      return 'in'
    case 'leave':
      return 'out'
  }
}
