import { NextApiRequest, NextApiResponse } from "next";
import ssx from "./_ssx";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    nonce: ssx.login(
      req.body.siwe,
      req.body.signature,
      req.body.daoLogin,
      req.cookies.nonce || ""
    ),
  });
}
