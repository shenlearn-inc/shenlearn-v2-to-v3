import {findSiteInfo} from "@/v2models/siteInfo"
import {createSchool} from "@/v3models/schools"
import config from "@/config"
import moment from "moment"
import toSchoolId from "@/utils/toSchoolId"
import {Trxs} from "@/types/Trxs";
import {Site} from "@/types/Site";

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移站台資料')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 轉移站台資料
  await createSchool({
    id: toSchoolId(siteInfoV2.hashedId),
    organizationId: site.organizationId,
    planId: site.planId,
    name: siteInfoV2.name,
    imageUrl: siteInfoV2.imageUrl,
    domain: siteInfoV2.databaseName,
    description: '',
    zone: config.zone,
    isActive: true,
    expiredDate: moment().add(1, 'year').format('YYYY-MM-DD'),
    certificateNumber: siteInfoV2.certificateNumber,
    telephonePrefix: siteInfoV2.phone ? '886' : null,
    telephone: siteInfoV2.phone ?? null,
    address: siteInfoV2.address ?? '',
    createdAt: siteInfoV2.createdAt ?? new Date(),
    updatedAt: siteInfoV2.updatedAt ?? new Date(),
    deletedAt: siteInfoV2.deletedAt,
  }, trxs)
}
