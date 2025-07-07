import type { Calendar, Contact, Drive, Event, Message, User } from "@microsoft/microsoft-graph-types";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { makeGraphRequest } from "./endpoint-factory";
import type { MicrosoftGraphPluginOptions } from "./types";

/**
 * Microsoft Graph integration for Better Auth
 *
 * @returns Better Auth plugin for Microsoft Graph
 */
export const microsoft = (options: MicrosoftGraphPluginOptions = {}) => {
    const { debugLogs = false } = options;

    return {
        id: "microsoft",
        endpoints: {
            // User.Read scope
            me: createAuthEndpoint(
                "/microsoft/me",
                {
                    method: "GET",
                    use: [sessionMiddleware],
                },
                async ctx => {
                    return await makeGraphRequest<"/me", User>(ctx.context, "me", debugLogs, {
                        method: "GET",
                        responseType: "single",
                    });
                }
            ),
            // Calendars.Read scope
            meCalendar: createAuthEndpoint(
                "/microsoft/me/calendar",
                {
                    method: "GET",
                    use: [sessionMiddleware],
                },
                async ctx => {
                    return await makeGraphRequest<"/me/calendar", Calendar>(ctx.context, "me/calendar", debugLogs, {
                        method: "GET",
                        responseType: "single",
                    });
                }
            ),
            // Calendars.Read scope
            meEvents: createAuthEndpoint(
                "/microsoft/me/events",
                {
                    method: "GET",
                    use: [sessionMiddleware],
                },
                async ctx => {
                    return await makeGraphRequest<"/me/events", Event>(ctx.context, "me/events", debugLogs, {
                        method: "GET",
                        responseType: "array",
                    });
                }
            ),
            // Contacts.Read scope
            meContacts: createAuthEndpoint(
                "/microsoft/me/contacts",
                {
                    method: "GET",
                    use: [sessionMiddleware],
                },
                async ctx => {
                    return await makeGraphRequest<"/me/contacts", Contact>(ctx.context, "me/contacts", debugLogs, {
                        method: "GET",
                        responseType: "array",
                    });
                }
            ),
            // Mail.Read scope
            meMessages: createAuthEndpoint(
                "/microsoft/me/messages",
                {
                    method: "GET",
                    use: [sessionMiddleware],
                },
                async ctx => {
                    return await makeGraphRequest<"/me/messages", Message>(ctx.context, "me/messages", debugLogs, {
                        method: "GET",
                        responseType: "array",
                    });
                }
            ),
            // Files.Read scope
            meDrive: createAuthEndpoint(
                "/microsoft/me/drive",
                {
                    method: "GET",
                    use: [sessionMiddleware],
                },
                async ctx => {
                    return await makeGraphRequest<"/me/drive", Drive>(ctx.context, "me/drive", debugLogs, {
                        method: "GET",
                        responseType: "single",
                    });
                }
            ),
        },
    } satisfies BetterAuthPlugin;
};

// Re-export useful types and functions for advanced usage
export type { GraphApiParams, GraphApiResult } from "./endpoint-factory";
