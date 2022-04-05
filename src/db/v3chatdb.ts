import Knex from "knex"
import config from "@/config"

let db: Knex

export default (dbName?: string): Knex => {
  if (!db) {
    if (!dbName) throw new Error('Need to provide dbName for the initialize process')
    db = Knex({
      client: 'pg',
      connection: {
        ...config.v3chatdb,
        database: dbName,
        port: 5432
      },
    })
  }
  return db
}
