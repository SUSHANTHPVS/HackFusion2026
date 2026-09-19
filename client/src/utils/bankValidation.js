/**
 * Bank Details Utilities for Client-side use
 * Mask account numbers and format bank details for display
 */

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

/**
 * Check if bank details are available and valid
 * @param {object} bankDetails - Bank details object
 * @returns {boolean} - True if bank details are present
 */
export const hasBankDetails = (bankDetails) => {
  return (
    bankDetails &&
    (bankDetails.accountNumber || bankDetails.ifscCode || bankDetails.bankName)
  );
};
