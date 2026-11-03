import { HttpError } from "./http-error.js";

export interface PaginationValues {
  page: number;
  limit: number;
  skip: number;
}

export function getPagination(pageValue: unknown, limitValue: unknown): PaginationValues {
  const page = pageValue === undefined ? 1 : Number(pageValue);
  const limit = limitValue === undefined ? 10 : Number(limitValue);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(400, "Query page harus berupa bilangan bulat minimal 1");
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new HttpError(400, "Query limit harus berupa bilangan bulat minimal 1");
  }

  return { page, limit, skip: (page - 1) * limit };
}
