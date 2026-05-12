'use client';

import { useCallback, useState } from 'react';

export function usePaginate(pageSize: number) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const buildQuery = useCallback(
    (base: string) => {
      return `${base}?page=${page}&pageSize=${pageSize}`;
    },
    [page, pageSize],
  );

  const applyTotal = useCallback(
    (total: number) => {
      setTotalPages(Math.max(1, Math.ceil(total / pageSize)));
    },
    [pageSize],
  );

  return { page, pageSize, totalPages, setPage, buildQuery, applyTotal };
}
