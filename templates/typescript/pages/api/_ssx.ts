import { SSXServer, SSXRPCProviders, SSXInfuraProviderNetworks } from "@spruceid/ssx-server";

const ssx = new SSXServer({
  signingKey: process.env.SSX_SIGNING_KEY,
  providers: {
    rpc: {
      service: SSXRPCProviders.SSXInfuraProvider,
      network: SSXInfuraProviderNetworks.GOERLI,
      apiKey: process.env.SSX_INFURA_ID ?? "",
    },
    metrics: {
      service: 'ssx',
      apiKey: process.env.SSX_API_TOKEN ?? ""
    }
  }
});

export default ssx;
