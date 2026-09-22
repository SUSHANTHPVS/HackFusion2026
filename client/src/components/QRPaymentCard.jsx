import { Download } from "lucide-react";

export function QRPaymentCard({ qrCode = "/logos/payment-qr.png" }) {
  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = "payment-qr.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-6">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Payment via QR Code</p>
        <p className="mt-2 text-sm font-semibold text-blue-900">Scan to Pay Registration Fee</p>
      </div>

      {/* QR Code Display */}
      <div className="flex justify-center">
        <div className="rounded-lg border-4 border-white bg-white p-4 shadow-md">
          <img
            src={qrCode}
            alt="Payment QR Code"
            className="h-64 w-64 object-contain"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 rounded-lg border-l-4 border-blue-600 bg-blue-100 p-4">
        <p className="text-xs font-semibold text-blue-900">📱 How to Pay:</p>
        <ol className="mt-3 space-y-2 text-xs text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Open your payment app (Google Pay, PhonePe, Paytm, etc.)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Scan this QR code with your phone camera or app</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Complete the payment transfer</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>Upload the payment receipt screenshot for verification</span>
          </li>
        </ol>
      </div>

      {/* Download Button */}
      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={handleDownloadQR}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Download size={16} />
          Download QR Code
        </button>
      </div>
    </div>
  );
}
