import { NextApiRequest, NextApiResponse } from "next";
import ssx from "./_ssx";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const nonce = ssx.generateNonce();
  req.cookies.nonce = nonce;
  res.status(200).send(nonce);
}
