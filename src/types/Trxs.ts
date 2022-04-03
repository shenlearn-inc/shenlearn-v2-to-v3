import Knex from "knex";

export interface Trxs {
  v2centraldb: Knex.Transaction
  v2db: Knex.Transaction
  v3db: Knex.Transaction
  v3chatdb: Knex.Transaction
}
