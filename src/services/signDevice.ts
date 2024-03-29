import {findStudentsByIds} from "../v2models/students.js";
import _ from "lodash";
import {findSiteInfo} from "../v2models/siteInfo.js";
import toStudentId from "../utils/toStudentId.js";
import toSchoolId from "../utils/toSchoolId.js";
import {Trxs} from "../types/Trxs.js";
import camelcaseKeys from "camelcase-keys";
import v2signdb from "../db/v2signdb.js";
import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys";
import v2db from "../db/v2db.js";
import {createPersonSignPins} from "../v3models/personSignPin.js";
import generateUUID from "../utils/generateUUID.js";
import {Site} from "../types/Site.js";
import PQueue from "p-queue";

interface TerminalV2 {
  id: string
  terminalNo: string;
  terminalName: string;
  macAddress: string | null;
  siteId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface StudentTerminalV2 {
  id: string
  studentId: number;
  pin: string;
  terminalName: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export default async (site: Site, trxs: Trxs) => {
  console.info('轉移簽到機資料與工號')

  // 取得站台資料
  const siteInfoV2 = await findSiteInfo(trxs)
  const schoolId = toSchoolId(siteInfoV2.hashedId)

  // 找簽到 site
  let terminalSite = await v2signdb()
    .first()
    .from("sites")
    .where("external_id", siteInfoV2.hashedId)
    .whereNull("deleted_at") as any
  if (!terminalSite?.id) {
    terminalSite = await v2signdb()
      .first()
      .from("sites")
      .where("server_url", "like", `%https://${siteInfoV2.databaseName}.%`)
      .whereNull("deleted_at") as any
    if (!terminalSite?.id) {
      return;
    }
  }

  // 轉移簽到機
  const terminals: TerminalV2[] = camelcaseKeys(
    await v2signdb()
      .select("*")
      .from("terminals")
      .where("site_id", terminalSite.id)
      .whereNull("deleted_at")
  );
  const terminalMap = _.keyBy(terminals, "terminalName");
  console.info(`找到 ${terminals.length}個 簽到機`)

  const devices: any = []
  for (const terminal of Object.values(terminalMap)) {
    const existedDevice = await v3db().first().from("sign_devices").where("id", terminal.terminalName).transacting(trxs.v3db)
    if (!!existedDevice) {
      devices.push(existedDevice)
      continue
    }
    const device = snakecaseKeys({
      id: terminal.terminalName,
      macAddress: terminal.macAddress,
      organizationId: site.organizationId,
      schoolId: schoolId,
      clazzId: null,
      zone: "Asia/Taipei",
      remark: "",
      createdAt: terminal.createdAt.toISOString(),
      updatedAt: terminal.updatedAt.toISOString(),
      deletedAt: terminal.deletedAt ? terminal.deletedAt.toISOString() : null,
    })
    await v3db().insert(device).from("sign_devices").transacting(trxs.v3db)
    devices.push(device)
  }

  const deviceMap = _.keyBy(devices, "id")

  // 轉移學生工號
  const studentTerminals: StudentTerminalV2[] = camelcaseKeys(
    await v2db()
      .select("*")
      .from("student_terminals")
      .whereNotNull("pin")
      .whereNotNull("terminal_name")
      .where("deleted_at", '0000-00-00 00:00:00')
      .transacting(trxs.v2db)
  );

  const v2StudentIds = Array.from(new Set(studentTerminals.map((studentTerminal) => studentTerminal.studentId)));
  if (!v2StudentIds.length) {
    return;
  }

  const v2Students = await findStudentsByIds(v2StudentIds, trxs);
  if (!v2Students.length) {
    return;
  }

  const queue = new PQueue({concurrency: 10});
  const v2StudentMap = _.keyBy(v2Students, "id");
  for (const studentTerminal of studentTerminals) {
    queue.add(async () => {
      const startTime = new Date().getTime()
      // 學生不存在 或是 簽到機沒有建立 都不轉移
      if (!(studentTerminal.studentId in v2StudentMap) || !(studentTerminal.terminalName in deviceMap)) {
        return;
      }
      const v2student = v2StudentMap[studentTerminal.studentId];
      await createPersonSignPins([{
        id: generateUUID(),
        personId: toStudentId(v2student.hashedId),
        personType: "student",
        schoolId,
        pin: studentTerminal.pin,
        signDeviceId: studentTerminal.terminalName,
        createdAt: studentTerminal.createdAt ? (studentTerminal.createdAt as any) === "0000-00-00 00:00:00" ? new Date().toISOString() : studentTerminal.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: studentTerminal.updatedAt ? (studentTerminal.updatedAt as any) === "0000-00-00 00:00:00" ? new Date().toISOString() : studentTerminal.updatedAt.toISOString() : new Date().toISOString(),
        deletedAt: studentTerminal.deletedAt ? (studentTerminal.deletedAt as any) === "0000-00-00 00:00:00" ? null : studentTerminal.deletedAt.toISOString() : null,
      }], trxs);
      console.info(`已處理學生指紋 ${v2student.hashedId}, time elapsed: ${(new Date().getTime() - startTime) / 1000}s`)
    })
  }
  await queue.onIdle();
}
