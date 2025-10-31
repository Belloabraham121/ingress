"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { walletApi } from "@/lib/api-client";

const ACCOUNT_ID_REGEX = /^\d+\.\d+\.\d+$/; // Hedera account format

export type ResolvedRecipient = {
  accountId: string;
  userId: string;
  name?: string;
};

export function useResolveRecipient(input: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResolvedRecipient | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const canResolve = useMemo(
    () => ACCOUNT_ID_REGEX.test(input.trim()),
    [input]
  );

  useEffect(() => {
    setResult(null);
    setError(null);

    if (!canResolve) return;

    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;

    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await walletApi.resolveAccountId(input.trim());
        setResult(data);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setError(e?.message || "Failed to resolve recipient");
        }
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [input, canResolve]);

  return { loading, error, result, canResolve } as const;
}
