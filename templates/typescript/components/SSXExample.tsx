import { SSX } from "@spruceid/ssx";
import Image from "next/image";
import { useState } from "react";
import ssxConfig from "../ssx.config";
import AccountInfo from "./AccountInfo";

const SSXExample = ({ }) => {

    const [ssxProvider, setSSX] = useState<SSX | null>(null);

    const ssxHandler = async () => {
        const ssx = new SSX(Object.keys(ssxConfig).length === 0 ? undefined : ssxConfig);
        await ssx.signIn();
        setSSX(ssx);
        (window as any).ssx = ssx;
    };

    const ssxLogoutHandler = async () => {
        ssxProvider?.signOut();
        setSSX(null);
    };

    return (
        <div className="App">
            <div className="App-header">
                <Image
                    src="/logo.svg"
                    alt="SSX Logo"
                    width={40}
                    height={40}
                />
                <h1>&nbsp;SSX Example dapp</h1>
            </div>
            {
                ssxProvider ?
                    <div className="App-content">
                        <h2>
                            Account Info
                        </h2>
                        <AccountInfo
                            address={ssxProvider?.address() || ''}
                        />
                        <button onClick={ssxLogoutHandler}>
                            Sign-Out
                        </button>
                    </div> :
                    <div className="App-content">
                        <h2>
                            Connect and Sign-In with your Ethereum account.
                        </h2>
                        <button onClick={ssxHandler}>
                            Sign-In with Ethereum
                        </button>
                    </div>
            }
        </div>
    );
};

export default SSXExample;