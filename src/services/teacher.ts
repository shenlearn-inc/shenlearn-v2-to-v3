import {findSiteInfo} from "@/v2models/siteInfo"
import {findAllTeachers, TeacherV2} from "@/v2models/teachers";
import {createTeachers} from "@/v3models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import {randomBytes} from "crypto"
import argon2 from "argon2"
import config from "@/config"
import toSchoolId from "@/utils/toSchoolId";
import toRoleId from "@/utils/toRoleId";
import {Trxs} from "@/types/Trxs";
import {createUsers} from "@/v3chatModels/users";
import generateUUID from "@/utils/generateUUID";
import v2db from "@/db/v2db";

// 轉移老師資料
export default async (trxs: Trxs) => {
  console.info('轉移老師資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  let v2Teachers = await findAllTeachers(99999, 0, trxs)
  if (!v2Teachers.length) return

  const randomPassword = randomBytes(10).toString('hex')
  const salt = randomBytes(32)
  const hashedPassword = await argon2.hash(randomPassword, {salt})

  // 取得 service 帳號
  const v2ServiceDirectorIndex = v2Teachers.findIndex((teacher) => teacher.name === "Service");
  if (v2ServiceDirectorIndex !== -1) {
    v2Teachers.splice(v2ServiceDirectorIndex, 1)
  }

  // 建立管理主任
  const [serviceDirector] = await createTeachers([
    {
      id: v2ServiceDirectorIndex !== -1 ? toTeacherId(v2Teachers[v2ServiceDirectorIndex].hashedId) : generateUUID(),
      username: `${siteInfoV2.databaseName}.service@shenlearn.com`,
      password: hashedPassword,
      salt: salt.toString('hex'),
      accessToken: null,
      refreshToken: null,
      schoolId: toSchoolId(siteInfoV2.hashedId),
      roleId: toRoleId('director'),
      name: 'Service',
      no: 'T00000001',
      avatarUrl: null,
      status: 'active',
      cardNo: null,
      cellphonePrefix: null,
      cellphone: null,
      telephonePrefix: null,
      telephone: null,
      email: `${siteInfoV2.databaseName}.service@shenlearn.com`,
      address: '',
      isSms: false,
      isEmail: false,
      remark: '',
      isInSchool: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    }
  ], trxs)

  // 建立管理主任 chat user
  await createUsers([{
    id: serviceDirector.id,
    name: serviceDirector.name,
    type: 'teacher',
    avatarUrl: null,
    createdAt: serviceDirector.createdAt ?? new Date(),
    updatedAt: serviceDirector.updatedAt ?? new Date(),
    deletedAt: serviceDirector.deletedAt,
  }], trxs)

  // 轉移老師資料
  const initHashedPassword = await argon2.hash(config.initTeacherPassword, {salt})
  await createTeachers(v2Teachers.map(t => {
    return {
      id: toTeacherId(t.hashedId),
      username: t.email ?? '',
      password: initHashedPassword,
      salt: salt.toString('hex'),
      accessToken: null,
      refreshToken: null,
      schoolId: toSchoolId(siteInfoV2.hashedId),
      roleId: toRoleId(t.position!),
      name: t.name ?? '',
      no: t.aftsId ?? 'T00000002',
      avatarUrl: null,
      status: !!t.status ? "active" : "inactive",
      cardNo: t.cardId,
      cellphonePrefix: t.cellphoneInternationalPrefix,
      cellphone: t.cellphone,
      telephonePrefix: t.telephoneInternationalPrefix,
      telephone: t.telephone,
      email: t.email,
      address: t.address ?? '',
      isSms: !!t.isSms,
      isEmail: !!t.isEmail,
      remark: t.remark ?? '',
      isInSchool: !!t.inclass,
      createdAt: t.createdAt ?? new Date(),
      updatedAt: t.updatedAt ?? new Date(),
      deletedAt: t.deletedAt,
    }
  }), trxs)

  // 建立老師 chat user
  await createUsers(v2Teachers.map(t => {
    return {
      id: toTeacherId(t.hashedId),
      name: t.name ?? '',
      type: 'teacher',
      avatarUrl: null,
      createdAt: t.createdAt ?? new Date(),
      updatedAt: t.updatedAt ?? new Date(),
      deletedAt: t.deletedAt,
    }
  }), trxs)
}
