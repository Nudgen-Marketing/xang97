export type PaginationState = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  skip: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResult<T> = Omit<PaginationState, "skip" | "totalCount"> & {
  items: T[];
  total: number;
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function getPaginationState({
  requestedPage,
  requestedPageSize,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPageSize = MAX_PAGE_SIZE,
  totalCount
}: {
  requestedPage: unknown;
  requestedPageSize?: unknown;
  pageSize?: number;
  maxPageSize?: number;
  totalCount: number;
}): PaginationState {
  const parsedPage = parseRequestedPage(requestedPage);
  const resolvedPageSize = parseRequestedPageSize(requestedPageSize, pageSize, maxPageSize);
  const totalPages = Math.max(1, Math.ceil(totalCount / resolvedPageSize));
  const page = Math.min(parsedPage, totalPages);

  return {
    page,
    pageSize: resolvedPageSize,
    totalCount: Math.max(0, totalCount),
    totalPages,
    skip: (page - 1) * resolvedPageSize,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  };
}

export function toPaginatedResult<T>(
  items: T[],
  pagination: PaginationState
): PaginatedResult<T> {
  return {
    items,
    total: pagination.totalCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    hasNextPage: pagination.hasNextPage,
    hasPreviousPage: pagination.hasPreviousPage
  };
}

function parseRequestedPage(value: unknown) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed =
    typeof rawValue === "string" || typeof rawValue === "number"
      ? Number.parseInt(String(rawValue), 10)
      : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function parseRequestedPageSize(value: unknown, defaultPageSize: number, maxPageSize: number) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed =
    typeof rawValue === "string" || typeof rawValue === "number"
      ? Number.parseInt(String(rawValue), 10)
      : Number.NaN;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return defaultPageSize;
  }

  return Math.min(parsed, maxPageSize);
}
