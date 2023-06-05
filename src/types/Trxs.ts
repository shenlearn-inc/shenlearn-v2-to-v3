import Knex from "knex";

export interface Trxs {
  v2db: Knex.Transaction
  v2chatdb: Knex.Transaction
  v3db: Knex.Transaction
  v3chatdb: Knex.Transaction
}
