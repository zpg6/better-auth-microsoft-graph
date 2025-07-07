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
