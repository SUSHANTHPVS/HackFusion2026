import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Info } from "lucide-react";

/**
 * Bank Details Form Component
 * Collects account holder name, account number, IFSC code, and bank name
 * for payment refund processing
 */
export const BankDetailsForm = ({ formData = {}, onChange = () => {}, errors = {} }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHelp, setShowHelp] = useState({});

  const bankDetails = formData.bankDetails || {
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    accountType: "savings"
  };

  const handleChange = (field, value) => {
    onChange({
      ...formData,
      bankDetails: {
        ...bankDetails,
        [field]: value
      }
    });
  };

  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Only digits
    handleChange("accountNumber", value);
  };

  const handleIfscChange = (e) => {
    const value = e.target.value.toUpperCase(); // Auto uppercase
    handleChange("ifscCode", value);
  };

  const isAnythingFilled =
    bankDetails.accountHolder ||
    bankDetails.accountNumber ||
    bankDetails.ifscCode ||
    bankDetails.bankName;

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-blue-100 hover:bg-blue-150 transition"
      >
        <div className="flex items-center gap-3">
          <Info size={20} className="text-blue-600" />
          <span className="font-semibold text-blue-900">Bank Details for Refunds</span>
          {isAnythingFilled && (
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
              ✓ Provided
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-blue-600" />
        ) : (
          <ChevronDown size={20} className="text-blue-600" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          <p className="text-sm text-gray-600 mb-4">
            📋 Provide your bank details for quick refund processing if needed. This information is
            securely stored and only used for refunds.
          </p>

          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name
              {!bankDetails.accountHolder && (
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g., Rajesh Kumar"
              value={bankDetails.accountHolder || ""}
              onChange={(e) => handleChange("accountHolder", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the name as it appears on your bank account</p>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
              {!bankDetails.accountNumber && (
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter 9-18 digit account number"
                value={bankDetails.accountNumber || ""}
                onChange={handleAccountNumberChange}
                maxLength="18"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowHelp({ ...showHelp, accountNumber: !showHelp.accountNumber })}
                className="absolute right-3 top-2 text-gray-400 hover:text-blue-500"
              >
                ?
              </button>
            </div>
            {showHelp.accountNumber && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <strong>Where to find:</strong> Check your cheque book, bank statement, or online banking portal
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">9-18 digits (only numbers)</p>
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code
              {!bankDetails.ifscCode && (
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., SBIN0001234"
                value={bankDetails.ifscCode || ""}
                onChange={handleIfscChange}
                maxLength="11"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
              <button
                type="button"
                onClick={() => setShowHelp({ ...showHelp, ifscCode: !showHelp.ifscCode })}
                className="absolute right-3 top-2 text-gray-400 hover:text-blue-500"
              >
                ?
              </button>
            </div>
            {showHelp.ifscCode && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <strong>Where to find:</strong> Format is always AAAA0BBBBBB (4 letters + 0 + branch code). Check
                cheque book or bank website
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">11 characters (auto-converted to uppercase)</p>
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name
              {!bankDetails.bankName && (
                <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g., State Bank of India"
              value={bankDetails.bankName || ""}
              onChange={(e) => handleChange("bankName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Official name of your bank</p>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              value={bankDetails.accountType || "savings"}
              onChange={(e) => handleChange("accountType", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="savings">Savings Account</option>
              <option value="current">Current Account</option>
            </select>
          </div>

          {/* Warning Message */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700">
              <strong>Privacy Notice:</strong> Your bank details are encrypted and stored securely. They will only be
              used for processing refunds if applicable. We never share this information with third parties.
            </div>
          </div>

          {/* Validation Errors */}
          {errors.bankDetails && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">⚠️ {errors.bankDetails}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BankDetailsForm;
