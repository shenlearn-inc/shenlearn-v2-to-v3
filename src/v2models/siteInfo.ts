import v2db from "../db/v2db"
import camelcaseKeys from "camelcase-keys"
import {Trxs} from "@/types/Trxs";

export interface SiteInfoV2 {
  name: string
  hashedId: string
  databaseName: string
  phone: string | null
  region: 'taiwan' | 'china' | 'hongkong' | 'macau' | 'singapore' | null
  address: string | null
  certificateNumber: string | null
  noticeNote: string | null
  receiptNote: string | null
  resetTime: number
  imageUrl: string | null
  signMode: 'sign-and-inclass' | 'sign-not-inclass' | null
  zone: number | null
  baseUrl: string | null
  isWebPay: number | null
  expenseNote: string | null
  isCustomizeChannelSummary: number
  coverCopySubDir: string | null
  isVideo: number
  videoRemark: string | null
  onesignalAppId: string | null
  chatServerUrl: string | null
  paymentNote: string | null
  examNote: string | null
  isTeacherViewNotification: number | null
  isCourseReservation: number | null
  pdfUrl: string | null
  mailgunKey: string | null
  mailgunDomain: string | null
  groupId: string | null
  isReview: number | null
  faceRecognitionUrl: string | null
  machineGroupId: string | null
  isSendAbsentMessage: number | null
  zoomToken: string | null
  cloudflareToken: string | null
  version: string | null
  numberOfCourseDiaryImage: number | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
}

export const findSiteInfo = async (trxs: Trxs): Promise<SiteInfoV2> => {
  const query = v2db()
    .first()
    .from('site_info')
    .transacting(trxs.v2db)

  return camelcaseKeys(await query)
}
