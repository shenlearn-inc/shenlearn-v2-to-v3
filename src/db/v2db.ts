import Knex from "knex"

let db: Knex

export default (dbName?: string): Knex => {
  if (!db) {
    if (!dbName) throw new Error('Need to provide dbName for the initialize process')
    db = Knex({
      client: 'mysql',
      connection: {
        host: 'db-gcp-1.shenlearn.com',
        database: dbName,
        user: 'shenlearn',
        password: 'e~A3L:dJO.F}wj*5Yz4',
        port: 3306,
      }
    })
  }
  return db
}
