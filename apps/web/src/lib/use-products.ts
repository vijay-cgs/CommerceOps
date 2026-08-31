"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "./catalog-api";
import { queryKeys } from "./query-keys";

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
    staleTime: 60_000,
  });
}
