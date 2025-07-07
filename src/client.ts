import type { BetterAuthClientPlugin } from "better-auth/client";
import type { microsoft } from ".";

/**
 * Microsoft Graph client plugin for Better Auth
 */
export const microsoftClient = () => {
    return {
        id: "microsoft",
        $InferServerPlugin: {} as ReturnType<typeof microsoft>,
    } satisfies BetterAuthClientPlugin;
};
