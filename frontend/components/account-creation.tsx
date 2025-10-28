"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBankAccount } from "@/hooks/useBankAccount";
import { useAuth } from "@/hooks/useAuth";

interface CardDetails {
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

export function AccountCreation() {
  const { createBankAccount, isLoading, error: apiError } = useBankAccount();
  const { getProfile } = useAuth();
  const [bvn, setBvn] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredBank, setPreferredBank] = useState<
    "test-bank" | "wema-bank" | "titan-paystack"
  >("test-bank");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedAccount, setGeneratedAccount] = useState<{
    accountNumber: string;
    bankName: string;
    accountName: string;
    instructions?: string;
  } | null>(null);
  const [addCardDetails, setAddCardDetails] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });
  const [cardError, setCardError] = useState("");
  const [cardSuccess, setCardSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateAccount = async () => {
    setError("");

    if (!bvn.trim()) {
      setError("BVN is required");
      return;
    }

    if (bvn.length !== 11) {
      setError("BVN must be 11 digits");
      return;
    }

    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required");
      return;
    }

    try {
      // If names are not provided, fetch from profile
      let fName = firstName;
      let lName = lastName;

      if (!fName || !lName) {
        const profile = await getProfile();
        fName = profile.user.firstName;
        lName = profile.user.lastName;
      }

      const response = await createBankAccount({
        bvn,
        firstName: fName,
        lastName: lName,
        phone,
        preferredBank,
      });

      setGeneratedAccount({
        accountNumber: response.accountNumber,
        bankName: response.bankName,
        accountName: response.accountName,
        instructions: response.instructions,
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to create bank account");
    }
  };

  const validateCardDetails = () => {
    setCardError("");

    if (!cardDetails.cardNumber.trim()) {
      setCardError("Card number is required");
      return false;
    }

    if (cardDetails.cardNumber.replace(/\s/g, "").length !== 16) {
      setCardError("Card number must be 16 digits");
      return false;
    }

    if (!cardDetails.cardholderName.trim()) {
      setCardError("Cardholder name is required");
      return false;
    }

    if (!cardDetails.expiryDate.trim()) {
      setCardError("Expiry date is required");
      return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      setCardError("Expiry date must be in MM/YY format");
      return false;
    }

    if (!cardDetails.cvv.trim()) {
      setCardError("CVV is required");
      return false;
    }

    if (cardDetails.cvv.length !== 3) {
      setCardError("CVV must be 3 digits");
      return false;
    }

    return true;
  };

  const handleAddCardDetails = () => {
    if (validateCardDetails()) {
      setCardSuccess(true);
      setTimeout(() => {
        setCardSuccess(false);
        setAddCardDetails(false);
        setCardDetails({
          cardNumber: "",
          cardholderName: "",
          expiryDate: "",
          cvv: "",
        });
      }, 2000);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  return (
    <div className="border border-border bg-background p-6">
      <h3 className="text-lg font-sentient mb-6">ACCOUNT SETUP</h3>

      {!isSubmitted ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-foreground/60 mb-2">
              BVN (Bank Verification Number)
            </label>
            <Input
              type="text"
              placeholder="Enter your 11-digit BVN"
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-foreground/60 mb-2">
              First Name
            </label>
            <Input
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-foreground/60 mb-2">
              Last Name
            </label>
            <Input
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-foreground/60 mb-2">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary"
            />
            <p className="text-xs font-mono text-foreground/50 mt-1">
              Format: 08012345678 or +2348012345678
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-foreground/60 mb-2">
              Preferred Bank
            </label>
            <select
              value={preferredBank}
              onChange={(e) =>
                setPreferredBank(
                  e.target.value as "test-bank" | "wema-bank" | "titan-paystack"
                )
              }
              className="w-full px-4 py-3 border border-border bg-background text-foreground font-mono text-sm focus:outline-none focus:border-primary"
            >
              <option value="test-bank">Test Bank (Testing Only)</option>
              <option value="wema-bank" disabled>
                Wema Bank (Production - Requires Approval)
              </option>
              <option value="titan-paystack" disabled>
                Titan Paystack (Production - Requires Approval)
              </option>
            </select>
            <p className="text-xs font-mono text-foreground/50 mt-1">
              Use "Test Bank" for testing with test API keys
            </p>
          </div>

          {(error || apiError) && (
            <p className="text-xs font-mono text-red-500">
              {error || apiError}
            </p>
          )}

          <Button
            onClick={handleGenerateAccount}
            disabled={
              isLoading ||
              !bvn.trim() ||
              !firstName.trim() ||
              !lastName.trim() ||
              !phone.trim()
            }
            className="w-full"
          >
            {isLoading ? "[CREATING ACCOUNT...]" : "[GENERATE ACCOUNT]"}
          </Button>
        </div>
      ) : generatedAccount ? (
        <div className="space-y-4">
          <div className="border border-border/50 p-4 space-y-3">
            <div>
              <p className="text-xs font-mono text-foreground/60 mb-1">
                ACCOUNT NUMBER
              </p>
              <p className="text-lg font-sentient text-primary">
                {generatedAccount.accountNumber}
              </p>
            </div>

            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-mono text-foreground/60 mb-1">
                BANK NAME
              </p>
              <p className="text-sm font-mono text-foreground">
                {generatedAccount.bankName}
              </p>
            </div>

            <div className="border-t border-border/50 pt-3">
              <p className="text-xs font-mono text-foreground/60 mb-1">
                ACCOUNT NAME
              </p>
              <p className="text-sm font-mono text-foreground">
                {generatedAccount.accountName}
              </p>
            </div>
          </div>

          <p className="text-xs font-mono text-green-500">
            {generatedAccount.instructions ||
              "Account successfully created. Use this account number for deposits."}
          </p>

          {!addCardDetails ? (
            <Button onClick={() => setAddCardDetails(true)} className="w-full">
              [ADD CARD DETAILS]
            </Button>
          ) : (
            <div className="border border-border/50 p-4 space-y-4 bg-background/50">
              <h4 className="text-sm font-sentient">
                ADD CARD DETAILS (OPTIONAL)
              </h4>

              <div>
                <label className="block text-xs font-mono text-foreground/60 mb-2">
                  Card Number
                </label>
                <Input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.cardNumber}
                  onChange={(e) =>
                    setCardDetails({
                      ...cardDetails,
                      cardNumber: formatCardNumber(e.target.value),
                    })
                  }
                  className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary font-mono"
                  maxLength={19}
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-foreground/60 mb-2">
                  Cardholder Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={cardDetails.cardholderName}
                  onChange={(e) =>
                    setCardDetails({
                      ...cardDetails,
                      cardholderName: e.target.value,
                    })
                  }
                  className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-foreground/60 mb-2">
                    Expiry Date
                  </label>
                  <Input
                    type="text"
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length >= 2) {
                        value = value.slice(0, 2) + "/" + value.slice(2, 4);
                      }
                      setCardDetails({
                        ...cardDetails,
                        expiryDate: value,
                      });
                    }}
                    className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary font-mono"
                    maxLength={5}
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-foreground/60 mb-2">
                    CVV
                  </label>
                  <Input
                    type="password"
                    placeholder="•••"
                    value={cardDetails.cvv}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        cvv: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="border border-border bg-background text-foreground placeholder:text-foreground/40 focus:border-primary font-mono"
                    maxLength={3}
                  />
                </div>
              </div>

              {cardError && (
                <p className="text-xs font-mono text-red-500">{cardError}</p>
              )}

              {cardSuccess && (
                <p className="text-xs font-mono text-green-500">
                  Card details added successfully!
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleAddCardDetails}
                  disabled={cardSuccess}
                  className="flex-1"
                >
                  [SAVE CARD]
                </Button>
                <Button
                  onClick={() => {
                    setAddCardDetails(false);
                    setCardError("");
                    setCardDetails({
                      cardNumber: "",
                      cardholderName: "",
                      expiryDate: "",
                      cvv: "",
                    });
                  }}
                  className="flex-1 opacity-70 hover:opacity-100"
                >
                  [SKIP]
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={() => {
              setIsSubmitted(false);
              setBvn("");
              setPhone("");
              setFirstName("");
              setLastName("");
              setGeneratedAccount(null);
              setAddCardDetails(false);
              setError("");
              setCardDetails({
                cardNumber: "",
                cardholderName: "",
                expiryDate: "",
                cvv: "",
              });
            }}
            className="w-full opacity-70 hover:opacity-100"
          >
            [CREATE NEW ACCOUNT]
          </Button>
        </div>
      ) : null}
    </div>
  );
}
