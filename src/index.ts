import type { Calendar, Contact, Drive, Event, Message, User } from "@microsoft/microsoft-graph-types";
import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";
import { makeGraphRequest } from "./endpoint-factory";
import type { GraphQueryOptions, MicrosoftGraphPluginOptions } from "./types";
import { GraphQueryOptionsBodySchema } from "./types";

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
            /** ALPHABETIZED by API PERMISSION SCOPE, then by ENDPOINT. CITATION REQUIRED. */

            // ================================
            // Calendars.Read scope
            // ================================

            /**
             * Get the user's primary calendar.
             * @see https://learn.microsoft.com/en-us/graph/api/calendar-get?view=graph-rest-1.0&tabs=http
             */
            meCalendar: createAuthEndpoint(
                "/microsoft/me/calendar",
                {
                    method: "GET",
                    body: GraphQueryOptionsBodySchema as z.ZodType<GraphQueryOptions>,
                    use: [sessionMiddleware],
                },
                async ctx => {
                    const graphOptions: GraphQueryOptions = ctx.body || {};
                    return await makeGraphRequest<"/me/calendar", Calendar>(ctx.context, "me/calendar", debugLogs, {
                        method: "GET",
                        responseType: "single",
                        graphOptions,
                    });
                }
            ),

            /**
             * Get the user's calendar events.
             * @see https://learn.microsoft.com/en-us/graph/api/user-list-events?view=graph-rest-1.0&tabs=http
             */
            meEvents: createAuthEndpoint(
                "/microsoft/me/events",
                {
                    method: "GET",
                    body: GraphQueryOptionsBodySchema as z.ZodType<GraphQueryOptions>,
                    use: [sessionMiddleware],
                },
                async ctx => {
                    const graphOptions: GraphQueryOptions = ctx.body || {};
                    return await makeGraphRequest<"/me/events", Event>(ctx.context, "me/events", debugLogs, {
                        method: "GET",
                        responseType: "array",
                        graphOptions,
                    });
                }
            ),

            // ================================
            // Contacts.Read scope
            // ================================

            /**
             * Get the user's contacts.
             * @see https://learn.microsoft.com/en-us/graph/api/user-list-contacts?view=graph-rest-1.0&tabs=http
             */
            meContacts: createAuthEndpoint(
                "/microsoft/me/contacts",
                {
                    method: "GET",
                    body: GraphQueryOptionsBodySchema as z.ZodType<GraphQueryOptions>,
                    use: [sessionMiddleware],
                },
                async ctx => {
                    const graphOptions: GraphQueryOptions = ctx.body || {};
                    return await makeGraphRequest<"/me/contacts", Contact>(ctx.context, "me/contacts", debugLogs, {
                        method: "GET",
                        responseType: "array",
                        graphOptions,
                    });
                }
            ),

            // ================================
            // Files.Read scope
            // ================================

            /**
             * Get the user's OneDrive drive.
             * @see https://learn.microsoft.com/en-us/graph/api/drive-get?view=graph-rest-1.0&tabs=http
             */
            meDrive: createAuthEndpoint(
                "/microsoft/me/drive",
                {
                    method: "GET",
                    body: GraphQueryOptionsBodySchema as z.ZodType<GraphQueryOptions>,
                    use: [sessionMiddleware],
                },
                async ctx => {
                    const graphOptions: GraphQueryOptions = ctx.body || {};
                    return await makeGraphRequest<"/me/drive", Drive>(ctx.context, "me/drive", debugLogs, {
                        method: "GET",
                        responseType: "single",
                        graphOptions,
                    });
                }
            ),

            // ================================
            // Mail.Read scope
            // ================================

            /**
             * Get the user's email messages.
             * @see https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0&tabs=http
             */
            meMessages: createAuthEndpoint(
                "/microsoft/me/messages",
                {
                    method: "GET",
                    body: GraphQueryOptionsBodySchema as z.ZodType<GraphQueryOptions>,
                    use: [sessionMiddleware],
                },
                async ctx => {
                    const graphOptions: GraphQueryOptions = ctx.body || {};
                    return await makeGraphRequest<"/me/messages", Message>(ctx.context, "me/messages", debugLogs, {
                        method: "GET",
                        responseType: "array",
                        graphOptions,
                    });
                }
            ),

            // ================================
            // User.Read scope
            // ================================

            /**
             * Get the current user's profile.
             * @see https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0&tabs=http
             */
            me: createAuthEndpoint(
                "/microsoft/me",
                {
                    method: "GET",
                    body: GraphQueryOptionsBodySchema as z.ZodType<GraphQueryOptions>,
                    use: [sessionMiddleware],
                },
                async ctx => {
                    const graphOptions: GraphQueryOptions = ctx.body || {};
                    return await makeGraphRequest<"/me", User>(ctx.context, "me", debugLogs, {
                        method: "GET",
                        responseType: "single",
                        graphOptions,
                    });
                }
            ),
        },
    } satisfies BetterAuthPlugin;
};

// Re-export useful types and functions for advanced usage
export type { GraphApiParams, GraphApiResult } from "./endpoint-factory";
export type { GraphQueryOptions, ODataQueryParams } from "./types";
