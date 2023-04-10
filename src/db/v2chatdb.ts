import Knex from "knex"

let db: Knex

export default (): Knex => {
  if (!db) {
    db = Knex({
      client: 'pg',
      connection: {
        host: '35.236.128.92',
        database: 'chat',
        user: 'shenlearn',
        password: 'Gy%YNawdzMfnR$8c',
        port: 5432,
      }
    })
  }
  return db
}
