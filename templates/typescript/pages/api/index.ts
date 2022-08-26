import next from "next";
import express, { Express } from "express";
import { SSXServer, SSXExpressMiddleware } from "@spruceid/ssx-server";
import cors from "cors";
import { providers } from "ethers";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const ssxServer = new SSXServer({
  apiToken: process.env.SSX_API_TOKEN,
  apiUrl: process.env.SSX_PLATFORM_API,
  signingKey: process.env.SSX_SIGNING_KEY,
  logging: process.env.SSX_SIGNING_KEY === "true",
  provider: new providers.InfuraProvider(
    "homestead",
    process.env.INFURA_API_KEY
  ),
});

app.prepare().then(() => {
  const server: Express = express();
  server.use(SSXExpressMiddleware(ssxServer));
  server.use(
    cors({
      credentials: true,
      origin: true,
    })
  );

  server.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
