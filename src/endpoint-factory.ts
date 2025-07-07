import type { AuthContext } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";

export const ERROR_CODES = {
    ACCOUNT_NOT_FOUND: "Microsoft account not found for user",
    NO_ACCESS_TOKEN: "No Microsoft access token found in account",
    TOKEN_EXPIRED: "Microsoft access token expired or invalid",
    INVALID_SCOPES: "Access token missing required scopes",
    GRAPH_API_ERROR: "Microsoft Graph API error",
    NETWORK_ERROR: "Network error communicating with Microsoft Graph",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * Result type for Graph API requests
 */
export interface GraphApiResult<T> {
    success: boolean;
    statusCode: number;
    data?: T;
    error?: {
        code: ErrorCode;
        message: string;
    };
}

/**
 * Parameters for Graph API requests (used by both client and server)
 */
export interface GraphApiParams {
    /** The Graph API endpoint path */
    endpoint: string;
    /** HTTP method to use */
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    /** Optional URL query parameters */
    params?: Record<string, string>;
    /** Optional request body for POST/PATCH requests */
    body?: any;
}

/**
 * Helper function to create standardized Microsoft Graph endpoints for Better Auth
 */
export const createGraphEndpoint = (path: string, handler: any) => {
    return createAuthEndpoint(
        path,
        {
            method: "GET",
            middleware: [sessionMiddleware],
        },
        async ctx => {
            return handler(ctx.context);
        }
    );
};

/**
 * Creates a custom Microsoft Graph API endpoint handler for flexible requests
 *
 * @param config - Configuration for the custom endpoint
 * @returns A function that makes the Graph API request
 */
export function createCustomGraphEndpoint(config: GraphApiParams, debugLogs: boolean) {
    return async (ctx: AuthContext): Promise<GraphApiResult<any>> => {
        return makeGraphRequest(ctx, config.endpoint, debugLogs, {
            method: config.method || "GET",
            responseType: "single",
            params: config.params,
            body: config.body,
        });
    };
}

/**
 * Core function to make authenticated requests to Microsoft Graph API
 *
 * @template TResponse - The expected response type
 * @param ctx - Better Auth context containing session information
 * @param endpoint - The Graph API endpoint to call
 * @param options - Request configuration options
 * @returns The response data from the Graph API wrapped in a result type
 */
export async function makeGraphRequest<E extends string, TResponse>(
    ctx: AuthContext,
    endpoint: string,
    debugLogs: boolean,
    options: {
        method?: "GET" | "POST" | "PATCH" | "DELETE";
        responseType: "single";
        params?: Record<string, string>;
        body?: any;
    }
): Promise<GraphApiResult<TResponse>>;
export async function makeGraphRequest<E extends string, TResponse>(
    ctx: AuthContext,
    endpoint: string,
    debugLogs: boolean,
    options: {
        method?: "GET" | "POST" | "PATCH" | "DELETE";
        responseType: "array";
        params?: Record<string, string>;
        body?: any;
    }
): Promise<GraphApiResult<TResponse[]>>;
export async function makeGraphRequest<E extends string, TResponse>(
    ctx: AuthContext,
    endpoint: string,
    debugLogs: boolean,
    options: {
        method?: "GET" | "POST" | "PATCH" | "DELETE";
        responseType: "single" | "array";
        params?: Record<string, string>;
        body?: any;
    }
): Promise<GraphApiResult<TResponse | TResponse[]>> {
    // Session is handled by sessionMiddleware, so we know ctx.session exists
    if (!ctx.session?.user?.id) {
        return {
            success: false,
            statusCode: 401,
            error: {
                code: "ACCOUNT_NOT_FOUND",
                message: "No user session found",
            },
        };
    }

    const account: { accessToken?: string } | null = await ctx.adapter.findOne({
        model: "account",
        where: [
            {
                field: "userId",
                operator: "eq",
                value: ctx.session.user.id,
            },
            {
                field: "providerId",
                operator: "eq",
                value: "microsoft",
            },
        ],
    });

    if (!account) {
        return {
            success: false,
            statusCode: 404,
            error: {
                code: "ACCOUNT_NOT_FOUND",
                message: ERROR_CODES.ACCOUNT_NOT_FOUND,
            },
        };
    }

    if (!account.accessToken) {
        return {
            success: false,
            statusCode: 401,
            error: {
                code: "NO_ACCESS_TOKEN",
                message: ERROR_CODES.NO_ACCESS_TOKEN,
            },
        };
    }

    // Build URL with query parameters
    let url = `https://graph.microsoft.com/v1.0/${endpoint}`;
    if (options.params) {
        const searchParams = new URLSearchParams(options.params);
        url += `?${searchParams.toString()}`;
    }

    const requestOptions: RequestInit = {
        method: options.method || "GET",
        headers: {
            Authorization: `Bearer ${account.accessToken}`,
            "Content-Type": "application/json",
        },
    };

    if (options.body && (options.method === "POST" || options.method === "PATCH")) {
        requestOptions.body = JSON.stringify(options.body);
    }

    if (debugLogs) {
        console.log("Making Graph API request:", url, requestOptions);
    }

    try {
        const response = await fetch(url, requestOptions);

        if (debugLogs) {
            console.log("Graph API response:", JSON.stringify(response, null, 4));
        }

        if (!response.ok) {
            let errorMessage = `Microsoft Graph API error: ${response.status} ${response.statusText}`;
            let errorCode: ErrorCode = "GRAPH_API_ERROR";

            // Handle specific HTTP status codes
            if (response.status === 401) {
                errorCode = "TOKEN_EXPIRED";
                errorMessage = ERROR_CODES.TOKEN_EXPIRED;
            } else if (response.status === 403) {
                // Check if it's a scope issue
                try {
                    const errorData: any = await response.json();
                    if (errorData.error?.code === "Forbidden" || errorData.error?.message?.includes("scope")) {
                        errorCode = "INVALID_SCOPES";
                        errorMessage = ERROR_CODES.INVALID_SCOPES;
                    } else {
                        errorCode = "GRAPH_API_ERROR";
                        errorMessage = errorData.error?.message || ERROR_CODES.GRAPH_API_ERROR;
                    }
                } catch {
                    errorCode = "INVALID_SCOPES";
                    errorMessage = ERROR_CODES.INVALID_SCOPES;
                }
            } else {
                // For other errors, try to get the actual error message from Graph API
                try {
                    const errorData: any = await response.json();
                    if (errorData.error?.message) {
                        errorMessage = errorData.error.message;
                    }
                } catch {
                    // If we can't parse the error response, use the default message
                }
            }

            return {
                success: false,
                statusCode: response.status,
                error: {
                    code: errorCode,
                    message: errorMessage,
                },
            };
        }

        if (debugLogs) {
            console.log("Graph API parsing response...");
        }

        const data: any = await response.json();

        if (debugLogs) {
            console.log("Graph API response parsed with data:", JSON.stringify(data, null, 4));
        }

        // Handle OData response format
        if (options.responseType === "array" && data.value) {
            return {
                success: true,
                statusCode: response.status,
                data: data.value as TResponse[],
            };
        }

        return {
            success: true,
            statusCode: response.status,
            data: data as TResponse,
        };
    } catch (error) {
        if (debugLogs) {
            console.log("Graph API request error:", error);
        }

        return {
            success: false,
            statusCode: 0,
            error: {
                code: "NETWORK_ERROR",
                message: ERROR_CODES.NETWORK_ERROR + ": " + (error instanceof Error ? error.message : "Unknown error"),
            },
        };
    }
}

/**
 * Server-side handler: Create custom Graph API endpoint with flexible configuration
 */
export const custom = (config: GraphApiParams, debugLogs: boolean) => {
    return createCustomGraphEndpoint(config, debugLogs);
};
