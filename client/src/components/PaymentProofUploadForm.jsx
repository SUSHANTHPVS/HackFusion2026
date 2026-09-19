import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { api } from "../services/api";

export function PaymentProofUploadForm({ teamId, paymentAmount, onSuccess, onError, isResubmission = false }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, success, error
  const [uploadMessage, setUploadMessage] = useState("");

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setUploadStatus("error");
      setUploadMessage("Please select an image file (PNG, JPG, etc.)");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadStatus("error");
      setUploadMessage("File size must be less than 5MB");
      return;
    }

    setFile(selectedFile);
    setUploadStatus("idle");
    setUploadMessage("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !teamId) return;

    // Validate UTR Number is provided (mandatory)
    if (!utrNumber.trim()) {
      setUploadStatus("error");
      setUploadMessage("UTR Number is required");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("paymentProof", file);
      formData.append("teamId", teamId);
      formData.append("utrNumber", utrNumber.trim());
      formData.append("transactionId", transactionId.trim());

      const response = await api.post("/payments/submit-proof", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setUploadStatus("success");
      setUploadMessage(response.data?.message || "Payment proof submitted successfully!");
      setFile(null);
      setPreview(null);
      setUtrNumber("");
      setTransactionId("");

      if (onSuccess) {
        onSuccess(response.data);
      }

      // Redirect to payment status page after brief delay to show success message
      setTimeout(() => {
        navigate("/participant/payment-status", { replace: true });
      }, 1500);
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage(
        error?.response?.data?.message || "Failed to upload payment proof. Please try again."
      );
      if (onError) {
        onError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border-2 border-blue-300 bg-blue-50 p-5">
      <div className="mb-4">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-800">
          {isResubmission ? "📤 Resubmit Payment Proof" : "Step 2: Upload Payment Proof"}
        </p>
        <p className="mt-1 text-xs text-blue-700">
          {isResubmission 
            ? "Upload a corrected screenshot of your payment receipt. Make sure it's clear and shows the complete transfer details."
            : "Upload a screenshot of your payment receipt (transfer confirmation)"}
        </p>
      </div>

      {/* File Input */}
      <div className="mb-4">
        <label className="block rounded-lg border-2 border-dashed border-blue-300 bg-white p-6 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-blue-600" />
            <p className="text-sm font-semibold text-slate-700">
              {file ? file.name : "Click to select payment receipt (image)"}
            </p>
            <p className="text-xs text-slate-500">PNG, JPG, JPEG • Max 5MB</p>
          </div>
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <img src={preview} alt="Payment receipt preview" className="w-full h-auto" />
          </div>
          <p className="mt-2 text-xs text-slate-600">Receipt preview</p>
        </div>
      )}

      {/* Status Message */}
      {uploadMessage && (
        <div
          className={`mb-4 flex gap-3 rounded-lg p-3 text-sm ${
            uploadStatus === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : uploadStatus === "error"
                ? "border border-rose-200 bg-rose-50 text-rose-900"
                : "border border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          <div className="shrink-0">
            {uploadStatus === "success" && <CheckCircle size={18} className="text-emerald-600" />}
            {uploadStatus === "error" && <AlertCircle size={18} className="text-rose-600" />}
          </div>
          <div>
            <p className="font-semibold">
              {uploadStatus === "success"
                ? "Upload successful"
                : uploadStatus === "error"
                  ? "Upload failed"
                  : "Message"}
            </p>
            <p className="mt-0.5">{uploadMessage}</p>
          </div>
        </div>
      )}

      {/* Amount Summary */}
      <div className="mb-4 rounded-lg bg-white p-3">
        <p className="text-xs font-semibold text-slate-600">Amount to Transfer</p>
        <p className="mt-1 text-lg font-bold text-slate-900">INR {paymentAmount}</p>
      </div>

      {/* UTR Number & Transaction ID */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-700">
            UTR Number <span className="text-rose-600">*</span>
            <input
              type="text"
              value={utrNumber}
              onChange={(event) => setUtrNumber(event.target.value)}
              placeholder="Enter UTR number (required)"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <p className="mt-1 text-xs text-slate-500">Enter the UTR number from your bank transfer (mandatory)</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-700">
            Transaction ID
            <input
              type="text"
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="Enter transaction ID (optional)"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <p className="mt-1 text-xs text-slate-500">Enter the transaction ID from your bank transfer (optional)</p>
        </div>
      </div>

      {/* Upload Button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || uploading || uploadStatus === "success"}
        className={`w-full rounded-lg px-4 py-2 font-semibold text-white transition ${
          uploading || !file || uploadStatus === "success"
            ? "cursor-not-allowed bg-slate-400"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader size={16} className="animate-spin" />
            Uploading...
          </span>
        ) : uploadStatus === "success" ? (
          "✓ Proof Submitted"
        ) : (
          "Submit Payment Proof"
        )}
      </button>

      <p className="mt-3 text-xs text-slate-600">
        📌 <strong>Admin Verification:</strong> Your payment will be verified within 24 hours. You'll receive a confirmation email once approved.
      </p>
    </div>
  );
}
