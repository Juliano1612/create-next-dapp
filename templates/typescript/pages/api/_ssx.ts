import { SSXServer } from "@spruceid/ssx-server";

const ssx = new SSXServer({
  apiToken: process.env.SSX_API_TOKEN,
  apiUrl: process.env.SSX_PLATFORM_API,
  signingKey: process.env.SSX_SIGNING_KEY,
  logging: true,
  provider: new providers.InfuraProvider(
    "homestead",
    process.env.INFURA_API_KEY
  ),
});

export default ssx;
