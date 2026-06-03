import assert from "node:assert/strict";
import test from "node:test";
import { getPaginationState, toPaginatedResult } from "@/lib/pagination";

test("getPaginationState defaults invalid pagination values", () => {
  const pagination = getPaginationState({
    requestedPage: "bad",
    requestedPageSize: "nope",
    totalCount: 52
  });

  assert.equal(pagination.page, 1);
  assert.equal(pagination.pageSize, 25);
  assert.equal(pagination.totalPages, 3);
  assert.equal(pagination.skip, 0);
  assert.equal(pagination.hasPreviousPage, false);
  assert.equal(pagination.hasNextPage, true);
});

test("getPaginationState clamps page and page size", () => {
  const pagination = getPaginationState({
    requestedPage: "99",
    requestedPageSize: "250",
    totalCount: 220
  });

  assert.equal(pagination.page, 3);
  assert.equal(pagination.pageSize, 100);
  assert.equal(pagination.totalPages, 3);
  assert.equal(pagination.skip, 200);
  assert.equal(pagination.hasPreviousPage, true);
  assert.equal(pagination.hasNextPage, false);
});

test("toPaginatedResult exposes public metadata without skip", () => {
  const pagination = getPaginationState({
    requestedPage: "2",
    requestedPageSize: "10",
    totalCount: 22
  });
  const result = toPaginatedResult(["station-11"], pagination);

  assert.deepEqual(result, {
    items: ["station-11"],
    total: 22,
    page: 2,
    pageSize: 10,
    totalPages: 3,
    hasPreviousPage: true,
    hasNextPage: true
  });
});
