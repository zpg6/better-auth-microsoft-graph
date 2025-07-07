import { KVNamespace } from "@cloudflare/workers-types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { withCloudflare } from "better-auth-cloudflare";
import { microsoft } from "better-auth-microsoft-graph";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { getDb } from "../db";

// Define an asynchronous function to build your auth configuration
async function authBuilder() {
    const dbInstance = await getDb();

    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
        throw new Error("MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET must be set");
    }

    return betterAuth(
        withCloudflare(
            {
                autoDetectIpAddress: true,
                geolocationTracking: true,
                cf: getCloudflareContext().cf,
                d1: {
                    db: dbInstance,
                    options: {
                        usePlural: true, // Optional: Use plural table names (e.g., "users" instead of "user")
                        debugLogs: true, // Optional
                    },
                },
                // Make sure "KV" is the binding in your wrangler.toml
                kv: process.env.KV as KVNamespace<string>,
            },
            // Your core Better Auth configuration (see Better Auth docs for all options)
            {
                baseURL: process.env.BETTER_AUTH_URL || "https://better-auth-mg.zpg6.workers.dev",
                socialProviders: {
                    microsoft: {
                        clientId: process.env.MICROSOFT_CLIENT_ID,
                        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
                        // Add prompt parameter to force consent flow
                        prompt: "consent",
                        scopes: [
                            // Basic user profile - Usually works without admin consent
                            "User.Read",

                            // Calendar and events - User consent only
                            "Calendars.Read",

                            // Contacts - User consent only
                            "Contacts.Read",

                            // Email messages - User consent only
                            "Mail.Read",

                            // OneDrive files - User consent only
                            "Files.Read",
                        ],
                    },
                },
                rateLimit: {
                    enabled: true,
                },
                plugins: [openAPI(), microsoft({ debugLogs: true })],
            }
        )
    );
}

// Singleton pattern to ensure a single auth instance
let authInstance: Awaited<ReturnType<typeof authBuilder>> | null = null;

// Asynchronously initializes and retrieves the shared auth instance
export async function initAuth() {
    if (!authInstance) {
        authInstance = await authBuilder();
    }
    return authInstance;
}

/* ======================================================================= */
/* Configuration for Schema Generation                                     */
/* ======================================================================= */

// This simplified configuration is used by the Better Auth CLI for schema generation.
// It includes only the options that affect the database schema.
// It's necessary because the main `authBuilder` performs operations (like `getDb()`)
// which use `getCloudflareContext` (not available in a CLI context only on Cloudflare).
// For more details, see: https://www.answeroverflow.com/m/1362463260636479488
export const auth = betterAuth({
    ...withCloudflare(
        {
            autoDetectIpAddress: true,
            geolocationTracking: true,
            cf: {},

            // No actual database or KV instance is needed here, only schema-affecting options
        },
        {
            // Include only configurations that influence the Drizzle schema
            plugins: [openAPI(), microsoft()],
        }
    ),

    // Used by the Better Auth CLI for schema generation.
    database: drizzleAdapter(process.env.DATABASE as any, {
        // Added 'as any' to handle potential undefined process.env.DATABASE
        provider: "sqlite",
        usePlural: true,
        debugLogs: true,
    }),
});
