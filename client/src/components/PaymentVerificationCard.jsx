import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader } from "lucide-react";
import { api } from "../services/api";

export function PaymentVerificationCard({ payment, teamName, onVerified, onRejected }) {
  const [adminNotes, setAdminNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: ({ paymentId, verificationStatus }) =>
      api
        .patch(`/admin/payments/${paymentId}/verify`, {
          verificationStatus,
          adminNotes
        })
        .then((res) => res.data),
    onSuccess: (data, variables) => {
      if (variables.verificationStatus === "approved") {
        onVerified?.();
      } else {
        onRejected?.();
      }
    }
  });

  if (!payment || !payment.paymentProofFile) {
    return null;
  }

  const isApproved = payment.status === "success";
  const isRejected = payment.status === "failed";
  const isPending = payment.status === "pending_verification";

  return (
    <div className="mt-6 rounded-lg border-2 border-blue-300 bg-blue-50 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-blue-800">Manual Payment Verification</h3>
        <p className="mt-1 text-xs text-blue-700">Team: {teamName}</p>
      </div>

      {/* Status Badge */}
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-white p-3">
        <div>
          {isApproved && <CheckCircle size={20} className="text-emerald-600" />}
          {isRejected && <XCircle size={20} className="text-rose-600" />}
          {isPending && <Loader size={20} className="text-blue-600 animate-spin" />}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600">Verification Status</p>
          <p className="text-sm font-bold uppercase text-slate-900">
            {isApproved ? "✓ Approved" : isRejected ? "✗ Rejected" : "⏳ Pending"}
          </p>
        </div>
        {payment.paymentApprovedAt && (
          <div className="ml-auto text-right">
            <p className="text-xs font-semibold text-slate-600">Verified On</p>
            <p className="text-xs text-slate-700">
              {new Date(payment.paymentApprovedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Payment Proof */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {showPreview ? "Hide Payment Proof" : "View Payment Proof"}
        </button>
        {showPreview && payment.paymentProofFile && (
          <div className="mt-3 rounded-lg border border-slate-300 overflow-hidden">
            <img
              src={payment.paymentProofFile}
              alt="Payment proof"
              className="w-full h-auto max-h-96"
              onError={() => (
                <p className="p-4 text-center text-sm text-slate-600">Unable to load image</p>
              )}
            />
          </div>
        )}
      </div>

      {/* Admin Notes */}
      {isPending && (
        <>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add verification notes (optional)"
            className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-500"
            rows={3}
          />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => verifyMutation.mutate({ paymentId: payment._id, verificationStatus: "approved" })}
              disabled={verifyMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Approve Payment
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => verifyMutation.mutate({ paymentId: payment._id, verificationStatus: "rejected" })}
              disabled={verifyMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  Reject Payment
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Display rejection reason if rejected */}
      {isRejected && payment.rejectionReason && (
        <div className="rounded-lg bg-rose-100 p-3">
          <p className="text-xs font-semibold text-rose-900">Rejection Reason:</p>
          <p className="mt-1 text-xs text-rose-800">{payment.rejectionReason}</p>
        </div>
      )}

      {verifyMutation.isError && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-semibold text-rose-900">Error:</p>
          <p className="text-xs text-rose-800">
            {verifyMutation.error?.response?.data?.message || "Failed to verify payment"}
          </p>
        </div>
      )}
    </div>
  );
}
