import prompts from "prompts";

async function run(env, onCancel) {
    await ask(env, onCancel);
}

async function ask(env, onCancel) {
    const { enableWalletConnect } = await prompts([
        {
            type: "toggle",
            name: "enableWalletConnect",
            message: "Would you like to enable WalletConnect?",
            active: "yes",
            inactive: "no",
            initial: true,
        }
    ],
        { onCancel }
    );

    if (enableWalletConnect) {
        env.NEXT_PUBLIC_SSX_INFURA_ID = env.SSX_INFURA_ID;
    }

}

export default {
    run
};