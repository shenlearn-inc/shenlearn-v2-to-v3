import config from "@/config"

export default (position: string): string => {
  switch (position) {
    case 'director':
      return config.directorRoleId
    case 'manager':
      return config.managerRoleId
    case 'teacher':
      return config.teacherRoleId
  }
  return config.teacherRoleId
}
