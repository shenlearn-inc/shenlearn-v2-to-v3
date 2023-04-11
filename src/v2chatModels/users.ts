import v2chatdb from "@/db/v2chatdb";
import camelcaseKeys from "camelcase-keys";

export interface UserV2 {
  id: string
  externalService: string | null
  externalRole: string | null
  externalId: string
  name: string | null
  email: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export const findUsersByIds = async (ids: string[]): Promise<UserV2[]> => {
  const query = v2chatdb()
    .select()
    .from('users')
    .whereIn("id", ids)
    .whereNull("deleted_at")

  return camelcaseKeys(await query);
}
