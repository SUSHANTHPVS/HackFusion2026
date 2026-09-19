import { useState } from "react";
import { Copy, Eye, EyeOff } from "lucide-react";

export function CollegePaymentDetailsCard({ bankDetails }) {
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!bankDetails) {
    return null;
  }

  const { accountHolder, accountNumber, ifscCode, bankName } = bankDetails;

  const maskedAccountNumber = accountNumber
    ? accountNumber.slice(0, 4) + "X".repeat(accountNumber.length - 8) + accountNumber.slice(-4)
    : "";

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">College Bank Account</p>
        <p className="mt-1 text-sm text-emerald-700">Transfer your registration fee to this account</p>
      </div>

      <div className="space-y-3">
        {/* Account Holder */}
        <div className="flex items-center justify-between rounded-lg bg-white p-3">
          <div>
            <p className="text-xs font-semibold text-slate-600">Account Holder</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">{accountHolder}</p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(accountHolder, "holder")}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
            title="Copy account holder"
          >
            {copiedField === "holder" ? (
              <span className="text-xs font-semibold text-emerald-600">✓ Copied</span>
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>

        {/* Account Number */}
        <div className="flex items-center justify-between rounded-lg bg-white p-3">
          <div>
            <p className="text-xs font-semibold text-slate-600">Account Number</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">
              {showFullAccount ? accountNumber : maskedAccountNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFullAccount(!showFullAccount)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
              title={showFullAccount ? "Hide account number" : "Show account number"}
            >
              {showFullAccount ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(accountNumber, "account")}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
              title="Copy account number"
            >
              {copiedField === "account" ? (
                <span className="text-xs font-semibold text-emerald-600">✓</span>
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>

        {/* IFSC Code */}
        <div className="flex items-center justify-between rounded-lg bg-white p-3">
          <div>
            <p className="text-xs font-semibold text-slate-600">IFSC Code</p>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">{ifscCode}</p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(ifscCode, "ifsc")}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
            title="Copy IFSC code"
          >
            {copiedField === "ifsc" ? (
              <span className="text-xs font-semibold text-emerald-600">✓ Copied</span>
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>

        {/* Bank Name */}
        <div className="rounded-lg bg-white p-3">
          <p className="text-xs font-semibold text-slate-600">Bank</p>
          <p className="mt-1 font-mono text-sm font-bold text-slate-900">{bankName}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border-l-4 border-emerald-600 bg-emerald-100 p-3">
        <p className="text-xs font-semibold text-emerald-900">📋 Next Step:</p>
        <p className="mt-2 text-xs text-emerald-800">
          Transfer the registration fee to the above account. Then upload the payment receipt screenshot for admin verification.
        </p>
      </div>
    </div>
  );
}
