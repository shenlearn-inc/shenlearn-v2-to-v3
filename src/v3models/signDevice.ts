import v3db from "../db/v3db.js";;
import snakecaseKeys from "snakecase-keys";
import {Trxs} from "../types/Trxs.js";
import camelcaseKeys from "camelcase-keys";

interface SignDeviceV3 {
  id: string;
  macAddress: string | null;
  organizationId: string | null;
  schoolId: string | null;
  clazzId: string | null;
  zone: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const createSignDevices = async (signDevices: SignDeviceV3[], trxs: Trxs): Promise<SignDeviceV3[]> => {
  const query = v3db()
    .insert(snakecaseKeys(signDevices))
    .from('sign_devices')
    .returning('*')
    .transacting(trxs.v3db)

  return camelcaseKeys(await query)
}
