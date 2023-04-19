import Knex from "knex"

let db: Knex

export default (): Knex => {
  if (!db) {
    db = Knex({
      client: 'mysql',
      connection: {
        host: 'db-gcp-1.shenlearn.com',
        database: 'sign_machine',
        user: 'shenlearn',
        password: 'e~A3L:dJO.F}wj*5Yz4',
        port: 3306,
      }
    })
  }
  return db
}
