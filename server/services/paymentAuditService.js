import { PaymentAudit } from "../models/PaymentAudit.js";

export async function logPaymentAudit(entry) {
  try {
    await PaymentAudit.create(entry);
  } catch (error) {
    // Audit logging should never break payment flow.
    console.error("Payment audit log failed", error?.message || error);
  }
}
