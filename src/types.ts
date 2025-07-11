import { z } from "zod";

// Re-export types from official Microsoft Graph v1.0 package
export type {
    Calendar,
    Contact,
    DirectoryObject,
    Drive,
    DriveItem,
    Event,
    Group,
    Message,
    Photo,
    Presence,
    Team,
    User,
} from "@microsoft/microsoft-graph-types";

/**
 * OData query parameters for Microsoft Graph API requests
 * @see https://learn.microsoft.com/en-us/graph/query-parameters
 */
export interface ODataQueryParams {
    /**
     * Select specific properties to return
     * @example $select=displayName,mail,jobTitle
     */
    $select?: string;

    /**
     * Filter results based on a Boolean condition
     * @example $filter=startsWith(displayName,'J')
     */
    $filter?: string;

    /**
     * Expand related entities inline
     * @example $expand=events,calendar
     */
    $expand?: string;

    /**
     * Order results by one or more properties
     * @example $orderby=displayName desc,createdDateTime
     */
    $orderby?: string;

    /**
     * Number of items to return (pagination)
     * @example $top=10
     */
    $top?: number;

    /**
     * Number of items to skip (pagination)
     * @example $skip=20
     */
    $skip?: number;

    /**
     * Search for items containing specific terms
     * @example $search="displayName:John"
     */
    $search?: string;

    /**
     * Include a count of the total number of items
     * @example $count=true
     */
    $count?: boolean;
}

/**
 * Options for Microsoft Graph API requests
 */
export interface GraphQueryOptions {
    /**
     * OData query parameters
     */
    query?: ODataQueryParams;

    /**
     * Custom headers to include in the request
     */
    headers?: Record<string, string>;
}

/**
 * Zod schema for GraphQueryOptions body validation in Better Auth endpoints
 */
export const GraphQueryOptionsBodySchema = z
    .object({
        query: z
            .object({
                $select: z.string().optional(),
                $filter: z.string().optional(),
                $expand: z.string().optional(),
                $orderby: z.string().optional(),
                $top: z.number().int().positive().max(999).optional(),
                $skip: z.number().int().min(0).optional(),
                $search: z.string().optional(),
                $count: z.boolean().optional(),
            })
            .optional(),
        headers: z.record(z.string()).optional(),
    })
    .optional();

/**
 * Microsoft Graph plugin configuration options
 */
export interface MicrosoftGraphPluginOptions {
    /**
     * Enable debug logs for Microsoft Graph API requests
     * @default false
     */
    readonly debugLogs?: boolean;
}

/**
 * Graph API Response wrapper for collections with proper typing
 * @see https://learn.microsoft.com/en-us/graph/api/overview?view=graph-rest-1.0#reading-from-microsoft-graph
 */
export interface GraphResponse<T> {
    readonly value: T[];
    readonly "@odata.nextLink"?: string;
    readonly "@odata.count"?: number;
    readonly "@odata.context"?: string;
}
