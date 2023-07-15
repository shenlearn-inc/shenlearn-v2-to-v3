import v3db from "../db/v3db.js";
import snakecaseKeys from "snakecase-keys";
import {Trxs} from "../types/Trxs.js";
import camelcaseKeys from "camelcase-keys";

interface PersonSignPinV3 {
  id: string;
  personId: string;
  personType: "student" | "teacher";
  pin: string | null;
  signDeviceId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const createPersonSignPins = async (personSignPinV3s: PersonSignPinV3[], trxs: Trxs): Promise<PersonSignPinV3[]> => {
  const query = v3db()
    .insert(snakecaseKeys(personSignPinV3s))
    .from('person_sign_pins')
    .returning('*')
    .transacting(trxs.v3db)

  return camelcaseKeys(await query)
}
