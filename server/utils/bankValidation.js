/**
 * Bank Details Validation Utilities
 * For validating Indian bank account details
 */

/**
 * Validate IFSC Code format (Indian Financial System Code)
 * Format: 4 letters (bank code) + 0 + 3-digit branch code
 * @param {string} ifscCode - The IFSC code to validate
 * @returns {boolean} - True if valid IFSC format
 */
export const validateIFSCCode = (ifscCode) => {
  if (!ifscCode || typeof ifscCode !== "string") {
    return false;
  }
  // IFSC format: AAAA0123456 (4 letters + 0 + 6 digits or variation)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifscCode.trim().toUpperCase());
};

/**
 * Validate Account Number format
 * Indian account numbers are typically 9-18 digits
 * @param {string} accountNumber - The account number to validate
 * @returns {boolean} - True if valid account number format
 */
export const validateAccountNumber = (accountNumber) => {
  if (!accountNumber || typeof accountNumber !== "string") {
    return false;
  }
  // Account numbers: 9-18 digits (including leading zeros)
  const accountRegex = /^[0-9]{9,18}$/;
  return accountRegex.test(accountNumber.trim());
};

/**
 * Validate Account Holder Name
 * Should be alphabetic with spaces and some special characters allowed
 * @param {string} accountHolder - The account holder name
 * @returns {boolean} - True if valid name format
 */
export const validateAccountHolder = (accountHolder) => {
  if (!accountHolder || typeof accountHolder !== "string") {
    return false;
  }
  // Allow letters, spaces, hyphens, and periods
  const nameRegex = /^[a-zA-Z\s\-\.]{3,100}$/;
  return nameRegex.test(accountHolder.trim());
};

/**
 * Validate Bank Name
 * @param {string} bankName - The bank name
 * @returns {boolean} - True if valid bank name format
 */
export const validateBankName = (bankName) => {
  if (!bankName || typeof bankName !== "string") {
    return false;
  }
  return bankName.trim().length >= 2 && bankName.trim().length <= 100;
};

/**
 * Sanitize and validate bank details object
 * @param {Object} bankDetails - Object containing bank details
 * @returns {Object} - Validated and sanitized bank details or null if invalid
 */
export const validateAndSanitizeBankDetails = (bankDetails) => {
  if (!bankDetails || typeof bankDetails !== "object") {
    return null;
  }

  const {
    accountHolder,
    accountNumber,
    ifscCode,
    bankName,
    accountType = "savings"
  } = bankDetails;

  // Check if at least some bank details are provided
  if (!accountNumber && !ifscCode && !accountHolder) {
    return null; // No bank details provided
  }

  const errors = [];

  if (accountHolder && !validateAccountHolder(accountHolder)) {
    errors.push("Invalid account holder name");
  }

  if (accountNumber && !validateAccountNumber(accountNumber)) {
    errors.push("Invalid account number (must be 9-18 digits)");
  }

  if (ifscCode && !validateIFSCCode(ifscCode)) {
    errors.push("Invalid IFSC code format");
  }

  if (bankName && !validateBankName(bankName)) {
    errors.push("Invalid bank name");
  }

  if (!["savings", "current"].includes(accountType)) {
    errors.push("Invalid account type");
  }

  if (errors.length > 0) {
    return { errors };
  }

  // Return sanitized bank details
  return {
    accountHolder: accountHolder ? accountHolder.trim() : null,
    accountNumber: accountNumber ? accountNumber.trim() : null,
    ifscCode: ifscCode ? ifscCode.trim().toUpperCase() : null,
    bankName: bankName ? bankName.trim() : null,
    accountType: accountType || "savings"
  };
};

/**
 * Mask account number for display (show last 4 digits only)
 * @param {string} accountNumber - Full account number
 * @returns {string} - Masked account number
 */
export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber) return "";
  const lastFour = accountNumber.slice(-4);
  return `****${lastFour}`;
};

/**
 * Format IFSC code for display
 * @param {string} ifscCode - IFSC code
 * @returns {string} - Formatted IFSC code
 */
export const formatIFSCCode = (ifscCode) => {
  if (!ifscCode) return "";
  return ifscCode.trim().toUpperCase();
};
