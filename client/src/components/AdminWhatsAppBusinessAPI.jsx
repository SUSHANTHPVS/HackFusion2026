import { useState, useEffect } from "react";
import { MessageCircle, Send, CheckCircle, AlertCircle, Loader, Copy } from "lucide-react";
import axios from "axios";

export default function AdminWhatsAppBusinessAPI() {
  const [participants, setParticipants] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState(
    "🎉 Join the IEEE Hackathon 2026 WhatsApp Group!\n\nhttps://chat.whatsapp.com/FrJNyMIjzkB3mNs6Dgg9qc\n\n📱 Get updates, announcements, and connect with other participants. See you at the hackathon! 🚀"
  );
  const [loading, setLoading] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [error, setError] = useState("");
  const [credentialsValid, setCredentialsValid] = useState(null);
  const [sendResults, setSendResults] = useState(null);
  const [apiEnabled, setApiEnabled] = useState(false);

  // Load participants and check credentials on mount
  useEffect(() => {
    fetchParticipants();
    checkCredentials();
  }, []);

  const fetchParticipants = async () => {
    try {
      setLoadingParticipants(true);
      setError("");
      
      const response = await axios.get("/api/admin/whatsapp/participants", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setParticipants(response.data.participants || []);
      setApiEnabled(response.data.total > 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load participants");
      console.error("Error fetching participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const checkCredentials = async () => {
    try {
      const response = await axios.get("/api/admin/whatsapp/check-credentials", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setCredentialsValid(response.data.valid);
      if (!response.data.valid) {
        setError("WhatsApp Business API credentials are not configured or invalid");
      }
    } catch (err) {
      console.error("Error checking credentials:", err);
      setCredentialsValid(false);
    }
  };

  const toggleAllSelected = () => {
    if (selected.size === participants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(participants.map((_, i) => i)));
    }
  };

  const toggleParticipant = (index) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const sendMessages = async () => {
    if (selected.size === 0) {
      setError("Please select at least one participant");
      return;
    }

    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSendResults(null);

      const selectedParticipants = Array.from(selected).map(i => participants[i]);
      const recipientMobiles = selectedParticipants.map(p => p.mobile);

      const response = await axios.post(
        "/api/admin/whatsapp/send",
        {
          recipientMobiles,
          message: message.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setSendResults({
        success: true,
        totalRequests: response.data.totalRequests,
        successful: response.data.successful,
        failed: response.data.failed,
        results: response.data.results
      });

      // Clear selection after sending
      setSelected(new Set());
      setMessage(
        "🎉 Join the IEEE Hackathon 2026 WhatsApp Group!\n\nhttps://chat.whatsapp.com/FrJNyMIjzkB3mNs6Dgg9qc\n\n📱 Get updates, announcements, and connect with other participants. See you at the hackathon! 🚀"
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send messages");
      setSendResults({
        success: false,
        error: err.response?.data?.message || err.message
      });
      console.error("Error sending messages:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!apiEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="text-yellow-600" size={24} />
          <h3 className="text-lg font-bold text-yellow-900">WhatsApp Business API Not Enabled</h3>
        </div>
        <p className="text-yellow-800 mb-4">
          To use WhatsApp Business API for automated message sending, you need to:
        </p>
        <ol className="list-decimal list-inside text-yellow-700 space-y-2 mb-4">
          <li>Create a Meta Business Account</li>
          <li>Set up WhatsApp Business API access</li>
          <li>Configure your access token and phone number ID in the .env file</li>
          <li>Set <code className="bg-yellow-200 px-2 py-1 rounded">ENABLE_WHATSAPP_BUSINESS_API=true</code></li>
        </ol>
        <p className="text-yellow-700">
          Currently, {participants.length} participant(s) can receive messages once configured.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="text-green-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">WhatsApp Business API</h2>
        </div>
        <p className="text-gray-600">Send messages to multiple participants automatically</p>
        
        {credentialsValid === false && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 text-sm">⚠️ WhatsApp credentials not configured or invalid</p>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Send Results */}
      {sendResults && (
        <div className={`rounded-lg p-4 border ${
          sendResults.success
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {sendResults.success ? (
              <CheckCircle className="text-green-600" size={20} />
            ) : (
              <AlertCircle className="text-red-600" size={20} />
            )}
            <h3 className={`font-bold ${
              sendResults.success ? "text-green-900" : "text-red-900"
            }`}>
              {sendResults.success ? "Messages Sent" : "Send Failed"}
            </h3>
          </div>
          {sendResults.success ? (
            <div className={`text-sm ${sendResults.success ? "text-green-800" : "text-red-800"}`}>
              <p>✅ Successful: {sendResults.successful}/{sendResults.totalRequests}</p>
              {sendResults.failed > 0 && <p>❌ Failed: {sendResults.failed}</p>}
              <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                {sendResults.results.map((result, idx) => (
                  <div key={idx} className={`text-xs ${result.success ? "text-green-700" : "text-red-700"}`}>
                    {result.success ? "✅" : "❌"} {result.phoneNumber}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-red-800 text-sm">{sendResults.error}</p>
          )}
        </div>
      )}

      {/* Participants Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Select Recipients</h3>
          <span className="text-sm text-gray-600">
            {selected.size} of {participants.length} selected
          </span>
        </div>

        {loadingParticipants ? (
          <div className="flex justify-center p-8">
            <Loader className="animate-spin text-green-500" size={24} />
          </div>
        ) : participants.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No participants with approved payments found</p>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              <button
                onClick={toggleAllSelected}
                className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm font-medium transition-colors"
              >
                {selected.size === participants.length ? "Deselect All" : "Select All"}
              </button>
              <span className="text-sm text-gray-600 flex items-center">
                {selected.size} selected
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-3">
              {participants.map((participant, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(idx)}
                    onChange={() => toggleParticipant(idx)}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {participant.name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {participant.mobile} • {participant.teamName}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Message Editor */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-3">Message Content</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Enter message to send..."
        />
        <p className="text-xs text-gray-500 mt-2">
          {message.length} characters • Max 4096 characters per message
        </p>
      </div>

      {/* Send Button */}
      {participants.length > 0 && (
        <button
          onClick={sendMessages}
          disabled={loading || selected.size === 0}
          className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              Sending...
            </>
          ) : (
            <>
              <Send size={20} />
              Send Messages to {selected.size} Recipient{selected.size !== 1 ? "s" : ""}
            </>
          )}
        </button>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ About WhatsApp Business API</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Sends messages to participants who have paid for the hackathon</li>
          <li>✓ Automatically formats numbers in international format</li>
          <li>✓ Rate-limited to prevent abuse (10 messages per batch, 1 second delay)</li>
          <li>✓ Each message counts as 1 unit in your WhatsApp Business account</li>
          <li>✓ Cost: Typically ₹0.50-2 per message depending on recipient country</li>
          <li>✓ Messages are logged for compliance and tracking</li>
        </ul>
      </div>
    </div>
  );
}
