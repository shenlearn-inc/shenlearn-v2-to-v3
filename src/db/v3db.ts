import Knex from "knex"

let db: Knex

export default (dbName?: string): Knex => {
  if (!db) {
    if (!dbName) throw new Error('Need to provide dbName for the initialize process')
    db = Knex({
      client: 'pg',
      // connection: {
      //   host: '35.236.128.92',
      //   user: 'shenlearn',
      //   password: 'Gy%YNawdzMfnR$8c',
      //   database: dbName,
      //   port: 5432
      // },
      connection: {
        host: 'localhost',
        user: 'shenlearn',
        password: '',
        database: dbName,
        port: 5432
      }
    })
  }
  return db
}
