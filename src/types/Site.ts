export interface Site {
  name: string
  organizationId: string
  planId: string
  roles: {
    directorRoleId: string
    managerRoleId: string
    teacherRoleId: string
  }
  isDeleteContactor: boolean
  isHandleDuplicateHashedId: boolean
}
