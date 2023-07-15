import {Site} from "@/types/Site";

export default (position: string, site: Site): string => {
  switch (position) {
    case 'director':
      return site.roles.directorRoleId
    case 'manager':
      return site.roles.managerRoleId
    case 'teacher':
      return site.roles.teacherRoleId
  }
  return site.roles.teacherRoleId
}
