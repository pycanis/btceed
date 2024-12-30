import b58 from "bs58check";
import { XPUB_HEX_PREFIX } from "../constants";

export const convertExtendedKeyToXpub = (extendedKey: string) => {
  let data = b58.decode(extendedKey);

  data = data.slice(4);

  data = Buffer.concat([Buffer.from(XPUB_HEX_PREFIX, "hex"), data]);

  return b58.encode(data);
};
