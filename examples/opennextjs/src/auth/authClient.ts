import { microsoftClient } from "better-auth-microsoft-graph/client";
import { createAuthClient } from "better-auth/react";

const client = createAuthClient({
    plugins: [microsoftClient()],
});

export default client;
