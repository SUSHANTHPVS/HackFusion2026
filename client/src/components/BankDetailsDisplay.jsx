import { AlertCircle } from "lucide-react";
import { maskAccountNumber, formatIFSCCode, hasBankDetails } from "../utils/bankValidation";

/**
 * Component to display bank details for admin refund processing
 * Shows masked account number and other details
 */
export const BankDetailsDisplay = ({ bankDetails, showFullDetails = false }) => {
  if (!hasBankDetails(bankDetails)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        <p className="font-semibold">No bank details provided</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle size={16} className="mt-1 shrink-0 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-900">Bank Details for Refund</p>
          
          <dl className="mt-3 grid gap-2 text-sm">
            {bankDetails.accountHolder && (
              <div className="flex justify-between">
                <dt className="font-semibold text-blue-700">Account Holder:</dt>
                <dd className="text-blue-900">{bankDetails.accountHolder}</dd>
              </div>
            )}
            
            {bankDetails.accountNumber && (
              <div className="flex justify-between">
                <dt className="font-semibold text-blue-700">Account Number:</dt>
                <dd className="font-mono text-blue-900">
                  {showFullDetails ? bankDetails.accountNumber : maskAccountNumber(bankDetails.accountNumber)}
                </dd>
              </div>
            )}
            
            {bankDetails.ifscCode && (
              <div className="flex justify-between">
                <dt className="font-semibold text-blue-700">IFSC Code:</dt>
                <dd className="font-mono text-blue-900">{formatIFSCCode(bankDetails.ifscCode)}</dd>
              </div>
            )}
            
            {bankDetails.bankName && (
              <div className="flex justify-between">
                <dt className="font-semibold text-blue-700">Bank Name:</dt>
                <dd className="text-blue-900">{bankDetails.bankName}</dd>
              </div>
            )}
            
            {bankDetails.accountType && (
              <div className="flex justify-between">
                <dt className="font-semibold text-blue-700">Account Type:</dt>
                <dd className="capitalize text-blue-900">{bankDetails.accountType}</dd>
              </div>
            )}
          </dl>
          
          <p className="mt-3 text-xs text-blue-700">
            ℹ️ Account numbers are masked for security. Full details are shown to authorized admins only.
          </p>
        </div>
      </div>
    </div>
  );
};
