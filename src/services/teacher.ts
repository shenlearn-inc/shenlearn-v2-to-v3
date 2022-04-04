import {findSiteInfo} from "@/v2models/siteInfo"
import {findAllTeachers} from "@/v2models/teachers";
import {createTeachers} from "@/v3models/teachers";
import toTeacherId from "@/utils/toTeacherId";
import {randomBytes} from "crypto"
import argon2 from "argon2"
import config from "@/config"
import toSchoolId from "@/utils/toSchoolId";
import toRoleId from "@/utils/toRoleId";
import {Trxs} from "@/types/Trxs";
import {createUsers} from "@/v3chatModels/users";

// 轉移老師資料
export default async (trxs: Trxs) => {
  console.info('轉移老師資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  const v2Teachers = await findAllTeachers(99999, 0, trxs)
  if (!v2Teachers.length) return

  const salt = randomBytes(32)
  const hashedPassword = await argon2.hash(config.initTeacherPassword, {salt})

  await createTeachers(v2Teachers.map(t => {
    return {
      id: toTeacherId(t.hashedId),
      username: t.email ?? '',
      password: hashedPassword,
      salt: salt.toString('hex'),
      accessToken: null,
      refreshToken: null,
      schoolId: toSchoolId(siteInfoV2.hashedId),
      roleId: toRoleId(t.position!),
      name: t.name ?? '',
      no: t.aftsId ?? '',
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
