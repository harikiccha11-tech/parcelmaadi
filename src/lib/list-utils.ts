// Shared pagination + filter parser for admin list endpoints
// Supports: page, limit (max 100), q (search), archived, status, sortBy, sortOrder
// Returns: { where, page, limit, skip, take, sortBy, sortOrder }

export interface ListParams {
  where: any;
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: "asc" | "desc";
  q?: string;
}

export function parseListParams(req: Request, opts: {
  searchFields?: string[];
  filterFields?: string[]; // fields that support exact match filtering
  defaultSortBy?: string;
  hasArchived?: boolean; // does model have archived field?
}): ListParams {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  // Cap limit at 100 to prevent huge responses
  const requestedLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Math.min(100, Math.max(1, requestedLimit));
  const skip = (page - 1) * limit;
  const q = url.searchParams.get("q") || undefined;
  const archived = url.searchParams.get("archived");
  const status = url.searchParams.get("status");
  const sortBy = url.searchParams.get("sortBy") || opts.defaultSortBy || "id";
  const sortOrder = (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const where: any = {};

  // Search across multiple fields with OR
  if (q && opts.searchFields && opts.searchFields.length > 0) {
    where.OR = opts.searchFields.map((f) => ({
      [f]: { contains: q, mode: "insensitive" },
    }));
  }

  // Filter by status if model has it
  if (status && opts.filterFields?.includes("status")) {
    where.status = status;
  }

  // Filter by archived if model supports it
  if (opts.hasArchived && archived !== null) {
    where.archived = archived === "true";
  }

  return { where, page, limit, skip, take: limit, sortBy, sortOrder, q };
}

// Helper to build paginated response
export function paginatedResponse(items: any[], total: number, page: number, limit: number) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}
