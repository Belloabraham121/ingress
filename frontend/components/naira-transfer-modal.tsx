"use client";

import { useState } from "react";
import { SuccessModal } from "@/components/success-modal";
import { useResolveRecipient } from "@/hooks/useResolveRecipient";
import { bankAccountApi } from "@/lib/api-client";

type NairaTransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function NairaTransferModal({
  isOpen,
  onClose,
}: NairaTransferModalProps) {
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const {
    result,
    loading: resolving,
    error,
  } = useResolveRecipient(recipientAccountId);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!recipientAccountId || !amount) {
      alert("Enter recipient account ID and amount.");
      return;
    }
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      alert("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      await bankAccountApi.transfer(recipientAccountId, amtNum);
      setSuccessOpen(true);
      try {
        window.dispatchEvent(new Event("walletUpdated"));
      } catch {}
    } catch (e: any) {
      console.error(e);
      alert(e?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background border border-border p-6 w-full max-w-md">
        <h3 className="text-lg font-sentient mb-4">Send NGN</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-foreground/60">
              Recipient Hedera Account ID
            </label>
            <input
              className="w-full px-3 py-2 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="0.0.xxxxx"
              value={recipientAccountId}
              onChange={(e) => setRecipientAccountId(e.target.value)}
            />
            {recipientAccountId && result && (
              <div className="mt-1 border border-border bg-background text-foreground font-mono text-xs p-2">
                <div className="flex items-center justify-between">
                  <span>{result.name || "Unknown user"}</span>
                  <span className="text-foreground/60">{result.accountId}</span>
                </div>
              </div>
            )}
            {recipientAccountId && !result && resolving && (
              <div className="mt-1 border border-border bg-background text-foreground/60 font-mono text-xs p-2">
                Resolving recipient…
              </div>
            )}
            {recipientAccountId && error && (
              <div className="mt-1 border border-border bg-background text-red-500 font-mono text-xs p-2">
                {error}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-mono text-foreground/60">
              Amount (₦)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 bg-background border border-border text-foreground placeholder-foreground/40 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
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

      <SuccessModal
        isOpen={successOpen}
        onClose={() => {
          setSuccessOpen(false);
          setRecipientAccountId("");
          setAmount("");
          onClose();
        }}
        title="Transfer Successful"
        message={`You sent ₦${Number(
          amount || 0
        ).toLocaleString()} to ${recipientAccountId}`}
        actionButtonText="[DONE]"
      />
    </div>
  );
}
