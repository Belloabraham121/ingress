"use client";

import { useState } from "react";
import { useResolveRecipient } from "@/hooks/useResolveRecipient";
import { getToken } from "@/lib/api";
import { SuccessModal } from "@/components/success-modal";

type TokenTransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  token: { name: string; symbol: string; address?: string } | null;
};

export function TokenTransferModal({
  isOpen,
  onClose,
  token,
}: TokenTransferModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [txId, setTxId] = useState<string | undefined>(undefined);
  const { result, loading: resolving, error } = useResolveRecipient(recipient);
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  if (!isOpen || !token) return null;

  const handleConfirm = async () => {
    if (!token.address) {
      alert("Token address not available.");
      return;
    }
    if (!recipient || !amount) {
      alert("Enter recipient and amount.");
      return;
    }
    setSubmitting(true);
    try {
      const jwt = getToken();
      const resp = await fetch(`${API_URL}/auth/transfer-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          tokenAddress: token.address,
          to: recipient,
          amount,
          decimals: 18,
        }),
      });
      const data = await resp.json();
      if (!data.success) {
        alert(data.message || "Transfer failed");
        return;
      }
      setTxId(data.data?.transactionHash);
      setSuccessOpen(true);
      window.dispatchEvent(new Event("activityUpdated"));
    } catch (e) {
      console.error(e);
      alert("Transfer error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background border border-border p-6 w-full max-w-md">
        <h3 className="text-lg font-sentient mb-4">Send {token.symbol}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-foreground/60">
              Recipient (Account ID or EVM)
            </label>
            <input
              className="w-full px-3 py-2 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="0.0.xxxxx or 0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            {recipient && result && (
              <div className="mt-1 border border-border bg-background text-foreground font-mono text-xs p-2">
                <div className="flex items-center justify-between">
                  <span>{result.name || "Unknown user"}</span>
                  <span className="text-foreground/60">{result.accountId}</span>
                </div>
              </div>
            )}
            {recipient && !result && resolving && (
              <div className="mt-1 border border-border bg-background text-foreground/60 font-mono text-xs p-2">
                Resolving recipient…
              </div>
            )}
            {recipient && error && (
              <div className="mt-1 border border-border bg-background text-red-500 font-mono text-xs p-2">
                {error}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-mono text-foreground/60">
              Amount
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              className="px-4 py-2 border border-border text-foreground font-mono text-sm hover:border-primary hover:text-primary transition-colors"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-primary text-background font-mono text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? "SENDING..." : "SEND"}
            </button>
          </div>
        </div>
      </div>
      {/* Success Modal */}
      <SuccessModal
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          setTxId(undefined);
          onClose();
          setRecipient("");
          setAmount("");
        }}
        title="Transfer Successful"
        message={`You sent ${amount} ${token.symbol}`}
        transactionHash={txId}
        explorerUrl={
          txId ? `https://hashscan.io/testnet/transaction/${txId}` : undefined
        }
        actionButtonText="[DONE]"
      />
    </div>
  );
}
