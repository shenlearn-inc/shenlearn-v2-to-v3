import {Trxs} from "../types/Trxs.js";
import generateUUID from "../utils/generateUUID.js";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toSchoolId from "../utils/toSchoolId.js";
import v3db from "../db/v3db.js";
import {TeacherV3} from "../v3models/teachers.js";
import toValidDateObj from "../utils/toValidDateObj.js";
import PQueue from "p-queue";
import {findAllVideos} from "../v2models/videos.js";
import {findAllVideoStudentRefsByVideoId} from "../v2models/videoStudentRefs.js";
import snakecaseKeys from "snakecase-keys";
import {findStudentsByIds, StudentV2} from "../v2models/students.js";
import _ from "lodash";
import toStudentId from "../utils/toStudentId.js";

const handleVideo = async ({ v2Video, serviceDirector, siteInfoV2, trxs }) => {
  const startTime = new Date().getTime();

  const refs = await findAllVideoStudentRefsByVideoId(v2Video.id, trxs)

  const studentIds = Array.from(refs.map((r) => r.studentId))
  // 找出學生
  const v2Students = await findStudentsByIds(studentIds, trxs) as StudentV2[]
  const v2StudentMap = _.keyBy(v2Students, 'id')

  const v3VideoId = generateUUID(v2Video.hashedId)
  await v3db()
    .insert(snakecaseKeys({
      id: v3VideoId,
      schoolId: toSchoolId(siteInfoV2.hashedId),
      name: v2Video.name,
      remark: v2Video.remark,
      url: v2Video.url ?? null,
      teacherId: serviceDirector.id,
      size: null,
      sawAfterJoin: false,
      expiredDate: toValidDateObj(v2Video.expiredDate)?.toISOString().slice(0, 10) ?? '2099-12-31',
      createdAt: toValidDateObj(v2Video.createdAt),
      updatedAt: toValidDateObj(v2Video.updatedAt),
      deletedAt: toValidDateObj(v2Video.deletedAt),
    }))
    .from('videos')
    .transacting(trxs.v3db)

  let data = [] as any
  if (studentIds.length) {
    data = studentIds.filter((studentId) => studentId in v2StudentMap).map((studentId) => {
      return {
        videoId: v3VideoId,
        studentId: toStudentId(v2StudentMap[studentId].hashedId),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    await v3db()
      .insert(snakecaseKeys(data))
      .from('video_student_refs')
      .transacting(trxs.v3db)
  }
  console.info(`已處理影片 ${v2Video.hashedId}, ${data.length} 個學生關係, time elapsed: ${(new Date().getTime() - startTime) / 1000}s`)
}

export default async (trxs: Trxs) => {
  console.info('轉移影片資料')
  const startTime = new Date().getTime();

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)

  // 取得 service 帳號
  const serviceDirector = await v3db()
    .first()
    .from('teachers')
    .where('no', 'T00000001')
    .where('school_id', toSchoolId(siteInfoV2.hashedId))
    .transacting(trxs.v3db) as TeacherV3

  // 找出影片
  const v2Videos = await findAllVideos(Number.MAX_SAFE_INTEGER, 0, trxs)

  if (!v2Videos.length) {
    console.log(`沒有影片需要處理`);
    return;
  }

  const queue = new PQueue({concurrency: 10});

  v2Videos.forEach((v2Video) => {
    queue.add(() => handleVideo({ v2Video, serviceDirector, siteInfoV2, trxs })).catch((error: any) => {
      console.log('處理影片出錯: ', {
        v2Video,
        error
      });
    });
  })

  await queue.onIdle();

  console.log(`所有影片處理完成, time elapsed: ${(new Date().getTime() - startTime) / 1000}s`);
}
