import dotenv from 'dotenv'

dotenv.config()

export default {
  // 必改
  site: 'lfntu',

  // 必改
  organizationId: 'de47ae02-5320-498d-9ebb-1f460c69b741',

  // 必改
  schoolId: '203e284f-d3b9-465c-82cc-824b073a045e',

  // 必改
  planId: '3cf984f6-4204-4b2c-96b4-8e32a382d111',

  // 必改，版本角色
  directorRoleId: '77e6bc2d-352b-444d-bc9f-fe486adbab7f',
  managerRoleId: 'd1da500a-bec5-42d8-9b04-c46db0d422a5',
  teacherRoleId: '1dc24d0c-80eb-4025-9d2c-0cb566c843f9',

  initTeacherPassword: 'test123',
  zone: 'Asia/Taipei',
  chunkSize: 100,
  studentRoleId: 'd9a7dc11-074d-403a-bd88-c35d30fe8b90',
  contactorRoleId: '26eaa76b-9090-43ec-b0c8-237bca571a33',

  v2db: {
    host: process.env.V2_DB_HOST,
    user: process.env.V2_DB_USER,
    password: process.env.V2_DB_PASSWORD,
  },

  v3db: {
    host: process.env.V3_DB_HOST,
    user: process.env.V3_DB_USER,
    password: process.env.V3_DB_PASSWORD,
  },

  v3chatdb: {
    host: process.env.V3_CHATDB_HOST,
    user: process.env.V3_CHATDB_USER,
    password: process.env.V3_CHATDB_PASSWORD,
  }
}
