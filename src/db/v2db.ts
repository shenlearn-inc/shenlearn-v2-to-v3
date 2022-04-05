import Knex from "knex"
import config from "@/config"

let db: Knex

export default (dbName?: string): Knex => {
  if (!db) {
    if (!dbName) throw new Error('Need to provide dbName for the initialize process')
    db = Knex({
      client: 'mysql',
      connection: {
        ...config.v2db,
        database: dbName,
        port: 3306,
      }
    })
  }
  return db
}
