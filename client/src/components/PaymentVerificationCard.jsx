import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader, AlertCircle, Mail, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { resolveFileUrl } from "../utils/constants";

export function PaymentVerificationCard({ payment, teamName, onVerified, onRejected, onDeleted }) {
  const [adminNotes, setAdminNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");

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
        setSuccessMessage(data.notification?.message || "Payment approved successfully!");
        
        // Broadcast payment approval to other pages (e.g., Registrations & Presence)
        // This triggers real-time sync without requiring manual refresh
        const event = new CustomEvent("paymentApproved", {
          detail: {
            paymentId: payment._id,
            teamId: payment.teamId,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
        console.log("[PaymentVerification] Broadcasted payment approval event");
        
        setTimeout(() => {
          setSuccessMessage("");
          onVerified?.();
        }, 3000);
      } else {
        onRejected?.();
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ paymentId, reason }) =>
      api
        .delete(`/admin/payments/${paymentId}`, {
          data: { reason }
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      setShowDeleteConfirm(false);
      setDeleteReason("");
      setSuccessMessage(data.notification?.message || "Payment deleted successfully!");
      
      // Broadcast payment deletion event
      const event = new CustomEvent("paymentDeleted", {
        detail: {
          paymentId: payment._id,
          teamId: payment.teamId,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(event);
      console.log("[PaymentDeletion] Broadcasted payment deletion event");
      
      setTimeout(() => {
        setSuccessMessage("");
        onDeleted?.();
      }, 3000);
    },
    onError: (error) => {
      console.error("[PaymentDeletion] Error deleting payment:", error);
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
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 flex gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4">
          <CheckCircle size={20} className="shrink-0 text-emerald-600" />
          <div>
            <p className="font-semibold text-emerald-900">✅ Success!</p>
            <p className="text-sm text-emerald-800">{successMessage}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
              <Mail size={14} />
              <span>Confirmation email sent to participant</span>
            </div>
          </div>
        </div>
      )}

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
          onClick={() => {
            setShowPreview(!showPreview);
            if (!resolvedImageUrl && !showPreview) {
              const url = resolveFileUrl(payment.paymentProofFile);
              setResolvedImageUrl(url);
              console.log("[PaymentProof] Resolved URL:", url);
            }
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {showPreview ? "Hide Payment Proof" : "View Payment Proof"}
        </button>
        {showPreview && payment.paymentProofFile && (
          <div className="mt-3 rounded-lg border border-slate-300 overflow-hidden bg-slate-50 p-2">
            {imageLoadError ? (
              <div className="flex flex-col items-center gap-2 p-6">
                <AlertCircle size={32} className="text-rose-600" />
                <p className="text-center text-sm font-semibold text-rose-900">Unable to load image</p>
                <p className="text-center text-xs text-rose-700">
                  File: <code className="break-all">{payment.paymentProofFile}</code>
                </p>
                <p className="text-center text-xs text-slate-600 mt-2">
                  URL: <code className="break-all text-[10px]">{resolvedImageUrl}</code>
                </p>
              </div>
            ) : (
              <img
                src={resolvedImageUrl || resolveFileUrl(payment.paymentProofFile)}
                alt="Payment proof"
                crossOrigin="anonymous"
                className="w-full h-auto max-h-96 object-contain"
                onLoad={() => {
                  setImageLoadError(false);
                  console.log("[PaymentProof] Image loaded successfully");
                }}
                onError={(e) => {
                  setImageLoadError(true);
                  console.error("[PaymentProof] Image load error:", {
                    src: e.target.src,
                    status: e.target.status,
                    complete: e.target.complete
                  });
                }}
              />
            )}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="mb-4 rounded-lg border-2 border-orange-300 bg-orange-50 p-4">
          <div className="mb-3 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 text-orange-600 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">⚠️ Confirm Delete</p>
              <p className="mt-1 text-sm text-orange-800">
                Are you sure you want to delete this payment transaction? This action cannot be undone and will be logged in the audit trail.
              </p>
            </div>
          </div>
          
          <textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Reason for deletion (optional)"
            className="mb-3 w-full rounded-lg border border-orange-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-500"
            rows={2}
          />
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteReason("");
              }}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteMutation.mutate({ paymentId: payment._id, reason: deleteReason })}
              disabled={deleteMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 py-2 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Confirm Delete
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Delete Button (Always Visible) */}
      {!showDeleteConfirm && !isApproved && (
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteMutation.isPending}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border-2 border-orange-300 bg-orange-50 px-3 py-2 font-semibold text-orange-700 hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />
          Remove Transaction
        </button>
      )}

      {verifyMutation.isError && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-semibold text-rose-900">Error:</p>
          <p className="text-xs text-rose-800">
            {verifyMutation.error?.response?.data?.message || "Failed to verify payment"}
          </p>
        </div>
      )}

      {deleteMutation.isError && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <p className="text-xs font-semibold text-rose-900">Error:</p>
          <p className="text-xs text-rose-800">
            {deleteMutation.error?.response?.data?.message || "Failed to delete payment"}
          </p>
        </div>
      )}
    </div>
  );
}
