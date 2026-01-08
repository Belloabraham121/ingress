"use client";

import { useEffect, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction as ApiTransaction } from "@/types/api";
import { Button } from "@/components/ui/button";

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-green-500";
    case "pending":
      return "text-yellow-500";
    case "failed":
      return "text-red-500";
    default:
      return "text-foreground/60";
  }
}

function formatAmount(amount: number, currency: string) {
  const symbol = currency === "NGN" ? "₦" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}

export function TransactionHistory() {
  const { getTransactions, isLoading, error } = useTransactions();
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    pages: number;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTransactions(currentPage);
  }, [currentPage]);

  const loadTransactions = async (page: number) => {
    try {
      const data = await getTransactions(page, 10);
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  };

  const handleRefresh = () => {
    loadTransactions(currentPage);
  };

  return (
    <div className="border border-border bg-background p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-sentient">TRANSACTION HISTORY</h3>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          size="sm"
          className="opacity-80 hover:opacity-100"
        >
          {isLoading ? "[LOADING...]" : "[REFRESH]"}
        </Button>
      </div>

      {error && <p className="text-xs font-mono text-red-500 mb-4">{error}</p>}

      {transactions.length === 0 && !isLoading && !error && (
        <p className="text-sm font-mono text-foreground/60 text-center py-8">
          No transactions found
        </p>
      )}

      {transactions.length > 0 && (
        <>
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-5 gap-4 mb-4 pb-4 border-b border-border/50">
            <div className="text-xs font-mono text-foreground/60">DATE</div>
            <div className="text-xs font-mono text-foreground/60">
              REFERENCE
            </div>
            <div className="text-xs font-mono text-foreground/60">CHANNEL</div>
            <div className="text-xs font-mono text-foreground/60 text-right">
              AMOUNT
            </div>
            <div className="text-xs font-mono text-foreground/60 text-right">
              STATUS
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="grid md:grid-cols-5 gap-4 py-4 border-b border-border/30 last:border-0 md:items-center"
              >
                {/* Mobile: Full width layout */}
                <div className="md:hidden space-y-2 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-mono text-foreground/60">
                        DATE
                      </p>
                      <p className="text-sm font-mono text-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p
                      className={`text-xs font-mono font-medium ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground/60">
                      REFERENCE
                    </p>
                    <p className="text-sm font-mono text-primary">
                      {transaction.reference}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground/60">
                      CHANNEL
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {transaction.channel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground/60">
                      AMOUNT
                    </p>
                    <p className="text-sm font-mono text-foreground font-medium">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </p>
                  </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden md:block">
                  <p className="text-sm font-mono text-foreground">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs font-mono text-foreground/50">
                    {new Date(transaction.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-mono text-primary font-medium">
                    {transaction.reference}
                  </p>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-mono text-foreground">
                    {transaction.channel}
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <p className="text-sm font-mono text-foreground font-medium">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <p
                    className={`text-xs font-mono font-medium ${getStatusColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                size="sm"
                className="opacity-80 hover:opacity-100"
              >
                [PREVIOUS]
              </Button>
              <span className="text-xs font-mono text-foreground/60">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= pagination.pages || isLoading}
                size="sm"
                className="opacity-80 hover:opacity-100"
              >
                [NEXT]
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
