import { z } from "zod";

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
