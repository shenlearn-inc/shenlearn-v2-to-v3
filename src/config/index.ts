import dotenv from 'dotenv'
import {Site} from "../types/Site.js";
import {padStart} from "lodash";

dotenv.config()

const plans = {
  flag: "3cf984f6-4204-4b2c-96b4-8e32a382d111",
  pro: "a9cb8f65-07f1-4663-8db1-d6c9948dd54e"
}

const roles = {
  flag: {
    directorRoleId: '77e6bc2d-352b-444d-bc9f-fe486adbab7f',
    managerRoleId: 'd1da500a-bec5-42d8-9b04-c46db0d422a5',
    teacherRoleId: '1dc24d0c-80eb-4025-9d2c-0cb566c843f9',
  },
  pro: {
    directorRoleId: '9c104851-4782-4835-83ab-93ff4c5882f4',
    managerRoleId: '2be42894-2afb-4b48-b466-c8204d4aaed7',
    teacherRoleId: 'f5144404-2f9b-49f1-a491-fa34ad2013da',
  },
}

export default {
  // !必改
  sites: [
    'goldmedalsh',
    'gm5892500new',
    // 'gm5892501new',
    'gm5712624new',
    'al365',
  ].map((name) => ({
    name,
    organizationId: "a6845149-88bd-4616-ad6b-93c9451e1f66",
    planId: plans.pro,
    roles: roles.pro,
    isDeleteContactor: false,
    isHandleDuplicateHashedId: true,
  })) as Site[],

  // !必改
  // 莘莘集團
  // organizationId: '546694a2-6e6b-4f1d-8bfd-7559fda0ffbf',
  // organizationId: "84063c50-e529-4a94-a9a2-cf53bd1440ff",
  // 是否要刪除聯絡人
  // isDeleteContactor: false,
  // 是否要處理學生 hashedId 重複
  // isHandleDuplicateHashedId: true,

  // !必改
  // 旗艦版
  // planId: '3cf984f6-4204-4b2c-96b4-8e32a382d111',
  // 專業版
  // planId: 'a9cb8f65-07f1-4663-8db1-d6c9948dd54e',

  // !必改，版本角色
  // 旗艦版
  // directorRoleId: '77e6bc2d-352b-444d-bc9f-fe486adbab7f',
  // managerRoleId: 'd1da500a-bec5-42d8-9b04-c46db0d422a5',
  // teacherRoleId: '1dc24d0c-80eb-4025-9d2c-0cb566c843f9',
  // 專業版
  // directorRoleId: '9c104851-4782-4835-83ab-93ff4c5882f4',
  // managerRoleId: '2be42894-2afb-4b48-b466-c8204d4aaed7',
  // teacherRoleId: 'f5144404-2f9b-49f1-a491-fa34ad2013da',

  // 預設為舊 siteInfo.hashed_id 轉換成 uuid, 可自定義
  // schoolId: '418b2015-3bfb-4dc5-8dca-834c6ca73353',

  initTeacherPassword: 'test123',
  zone: 'Asia/Taipei',
  chunkSize: 1000,
  studentRoleId: 'd9a7dc11-074d-403a-bd88-c35d30fe8b90',
  contactorRoleId: '26eaa76b-9090-43ec-b0c8-237bca571a33',
  unknownChatUser: '7e60d5e5-23ce-499c-839a-b7e8f233e932',

  v2db: {
    host: process.env.V2_DB_HOST,
    user: process.env.V2_DB_USER,
    password: process.env.V2_DB_PASSWORD,
  },

  v3db: {
    host: process.env.V3_DB_HOST,
    user: process.env.V3_DB_USER,
    password: process.env.V3_DB_PASSWORD,
    database: process.env.V3_DB_NAME,
  },

  v3chatdb: {
    host: process.env.V3_CHATDB_HOST,
    user: process.env.V3_CHATDB_USER,
    password: process.env.V3_CHATDB_PASSWORD,
    database: process.env.V3_CHATDB_NAME,
  }
}

// 'hlkd',
// 'rulinty',
// 'gailenglishnew',
// 'chiaoyangdayeh',
// 'chiaoyangdayou',
// 'bishengnew',
// 'cls',
// 'yspro',
// 'pigdogletternew',
// 'taiat3176767',
// 'reggioscience',
// 'tah',
// 'giraffesp10new',
// 'sunlight',
// 'hanway',
// 'sensei',
// 'panpole627',
// 'sinsing',
// 'hungguang',
// 'chengguang',
// 'newtoeic',
// 'chushin02',
// 'tachih',
// 'pochuan',
// 'huangs88',
// 'guantengnew',
// 'sowaclass',
// 'zhengyinew',
// 'muchaartnew',
// 'tplsnew',
// 'muchaart1new',
// 'kidcastle01',
// 'sunshinetaichung',
// 'dc47',
// 'lovetolearn',
// 'knowhownew',
// 'chihyi',
// 'bihua',
// 'justwinnew',
// 'fudannew',
// 'maggieenew',
// 'josephihonew',
// 'mininnew',
// 'wfc',
// 'rootwondernew',
// 'nlkd',
// 'pan',
// 'jjkd',
// 'fskd',
// 'tdkd',
// 'fudan02',
// 'sinsiangnew',
// 'lykd',
// 'wskd',
// 'jingyeclass',
// 'youjia01',
// 'academiceducation',
// 'sunyang',
// 'yixiuenglishclass',
// 'hdprofessional',
// 'chiahua2new',
// '27040new',
// 'chiahuanew',
// 'haydn',
// 'bear123new',
// 'gm062005588new',
// '4333007new',
// 'taidanew',
// 'texunew',
// 'lingyunnew',
// 'longshengnew',
// 'auroranew',
// 'great5576new',
// 'shinhenew',
// 'giraffesg870new',
// 'taiattd3255050',
// 'mrt',
// 'p033893334',
// 'arknew',
// 'giraffe29960680',
// 'milesnew',
// 'hjunphysicsmnew',
// 'dashannew',
// 'chushin',
// 'knockknock',
// 'jasonleader',
// 'giraffe1026new',
// 'chingshanshu',
// 'wentengnew',
// 'giraffefive',
// 'gardennew',
// 'rubyzx',
// 'liwei',
// 'aliothnew',
// 'aceyilannew',
// 'vincen2003new',
// 'drpromathnew',
// 'taipeirulinnew',
// 'city8831new',
// 'newtonnew',
// 'kmsupernew',
// 'liupingtungnew',
// 'jingwennew',
// 'playdreamnew',
// 'alecnew',
// 'dsedunew',
// 'jcsfnew',
// 'wangshihnew',
// 'smilenew',
// 'oxonian',
// 'jinlin',
// 'gm168new',
// 'wordsmusic',
// 'rwtkd',
// 'jdkd',
// 'happyenglishnew',
// 'wenxinnew',
// 'fanghuads14',
// 'al365'
