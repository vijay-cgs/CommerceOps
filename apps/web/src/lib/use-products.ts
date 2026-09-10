"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProductsPage } from "./catalog-api";
import { queryKeys } from "./query-keys";

export function useProducts(page = 1, pageSize = 24) {
  return useQuery({
    queryKey: [...queryKeys.products, page, pageSize],
    queryFn: () => fetchProductsPage(page, pageSize),
    staleTime: 60_000,
  });
}
