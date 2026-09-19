import { useState, useEffect } from "react";
import { Copy, Check, MessageCircle, Share2, Link2 } from "lucide-react";
import axios from "axios";

export default function AdminWhatsAppGroupLink() {
  const [groupLink, setGroupLink] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWhatsAppLink();
  }, []);

  const fetchWhatsAppLink = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get("/api/admin/whatsapp/group-link", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setGroupLink(response.data.groupLink);
      setShareMessage(response.data.shareMessage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch WhatsApp group link");
      console.error("Error fetching WhatsApp link:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(groupLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyMessageToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const openWhatsApp = () => {
    // Opens WhatsApp Web or mobile with the group link
    const encodedMessage = encodeURIComponent(shareMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  const openGroupLink = () => {
    // Opens the WhatsApp group link directly
    window.open(groupLink, "_blank");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="text-green-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">WhatsApp Group Link</h2>
            <p className="text-gray-600">Share with participants via your WhatsApp</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <div className="text-red-600 text-lg">⚠️</div>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Link Display Section */}
        <div className="bg-white rounded-lg border border-green-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={20} className="text-green-600" />
            <label className="text-sm font-semibold text-gray-700">Group Link</label>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={groupLink}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm text-gray-700 cursor-text"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check size={18} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            💡 Share this link in your WhatsApp. Participants can click to join the group.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Open WhatsApp Button */}
          <button
            onClick={openWhatsApp}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all hover:shadow-lg"
          >
            <MessageCircle size={20} />
            Open WhatsApp
          </button>

          {/* Join Group Button */}
          <button
            onClick={openGroupLink}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all hover:shadow-lg"
          >
            <Share2 size={20} />
            Join Group
          </button>
        </div>

        {/* Pre-formatted Message */}
        <div className="bg-white rounded-lg border border-green-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={20} className="text-green-600" />
            <label className="text-sm font-semibold text-gray-700">Share Message</label>
          </div>
          <textarea
            value={shareMessage}
            readOnly
            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-sm text-gray-700 h-24 mb-3 resize-none"
          />
          <button
            onClick={copyMessageToClipboard}
            className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} />
                Message Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Message
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            💡 Copy this message and paste it in your WhatsApp to share with participants or in WhatsApp groups.
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How to Use</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Copy the group link and share in your WhatsApp</li>
            <li>✓ Click "Open WhatsApp" to share via WhatsApp Web/Mobile</li>
            <li>✓ Use the pre-formatted message to make sharing easier</li>
            <li>✓ Participants will receive the link in their approval email automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
