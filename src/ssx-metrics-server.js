import prompts from "prompts";
import { launchUrl } from "./process.js";

async function run(env, onCancel) {
    await ask(env, onCancel);
}

async function ask(env, onCancel) {
    const { enableSSXPlatform, alreadyHaveAPIKey } = await prompts([
        {
            type: "toggle",
            name: "enableSSXPlatform",
            message: "Would you like to enable the SSX metrics platform?",
            active: "yes",
            inactive: "no",
            initial: true,
        },
        {
            type: prev => prev == true ? 'toggle' : null,
            name: "alreadyHaveAPIKey",
            message: "Do you already have an API Key?\nIf you don't have we will open the browser on the SSX Platform to continue the project creation to get a new API Key",
            active: "yes",
            inactive: "no",
            initial: false,
        }
    ],
        { onCancel }
    );

    if (enableSSXPlatform) {
        if (!alreadyHaveAPIKey) {
            launchUrl("https://app.ssx.id/login?returnTo=/projects/new");
        }
        const { ssxPlatformAPI } = await prompts([
            {
                type: 'text',
                name: "ssxPlatformAPI",
                message: "Provide the SSX Platform API Key "
            }
        ],
            { onCancel }
        );

        env.SSX_API_TOKEN = ssxPlatformAPI ?? "";
        env.SSX_ENABLE_METRICS = true;
    }

}

export default {
    run
};