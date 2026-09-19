import { useState, useEffect } from "react";
import { MessageSquare, Copy, Check, AlertCircle, Loader2, Users, Send } from "lucide-react";
import { api } from "../services/api";

/**
 * Manual WhatsApp Group Link Sender
 * Allows admin to send WhatsApp group link to participants with one click
 */
export function ManualWhatsAppGroupLinkSender() {
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState(new Set());
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendMethod, setSendMethod] = useState(null); // 'api' or 'manual'
  const [sendResults, setSendResults] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  // Load participants when modal opens
  useEffect(() => {
    if (isOpen && participants.length === 0) {
      loadParticipants();
    }
  }, [isOpen]);

  const loadParticipants = async () => {
    setIsLoadingParticipants(true);
    setError("");
    try {
      const response = await api.get("/admin/whatsapp/participants");
      setParticipants(response.data?.participants || []);
      setSelectedRecipients(new Set()); // Clear selection
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load participants");
      setParticipants([]);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const toggleRecipient = (mobile) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(mobile)) {
      newSelected.delete(mobile);
    } else {
      newSelected.add(mobile);
    }
    setSelectedRecipients(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRecipients.size === participants.length) {
      setSelectedRecipients(new Set());
    } else {
      const allMobiles = new Set(participants.map((p) => p.mobile));
      setSelectedRecipients(allMobiles);
    }
  };

  const handleSendViaAPI = async () => {
    if (selectedRecipients.size === 0) {
      setError("Please select at least one recipient");
      return;
    }

    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      const recipientMobiles = Array.from(selectedRecipients);
      const response = await api.post("/admin/whatsapp/send-link-manual", {
        recipientMobiles
      });

      setSendMethod("api");
      setSendResults(response.data);
      setSuccess(`✅ Messages sent! ${response.data.successful} successful, ${response.data.failed} failed`);
      setSelectedRecipients(new Set());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send messages");
    } finally {
      setIsSending(false);
    }
  };

  const handleManualCopy = async () => {
    if (selectedRecipients.size === 0) {
      setError("Please select at least one recipient");
      return;
    }

    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      const recipientMobiles = Array.from(selectedRecipients);
      const response = await api.post("/admin/whatsapp/send-link-manual", {
        recipientMobiles
      });

      setSendMethod("manual");
      setSendResults(response.data);

      // Copy message to clipboard
      const messageText = response.data.messageToSend;
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      setSuccess("✅ Message copied to clipboard! Paste it in WhatsApp");
      setSelectedRecipients(new Set());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to prepare message");
    } finally {
      setIsSending(false);
    }
  };

  const resetResults = () => {
    setSendResults(null);
    setSendMethod(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
      >
        <MessageSquare size={16} />
        Send WhatsApp Link (Manual)
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Send WhatsApp Group Link</h2>
              <p className="mt-1 text-sm text-slate-600">Manually send the group link to approved participants</p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                resetResults();
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <Check size={18} className="mt-0.5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* Send Results */}
          {sendResults && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Delivery Summary</h3>

              {sendMethod === "api" && (
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    <strong>Method:</strong> WhatsApp Business API
                  </p>
                  <p>
                    <strong>Total Sent:</strong> {sendResults.totalRequests}
                  </p>
                  <p>
                    <strong>Successful:</strong> {sendResults.successful} ✅
                  </p>
                  <p>
                    <strong>Failed:</strong> {sendResults.failed} ❌
                  </p>
                  <p className="mt-3">
                    <strong>Group Link:</strong>{" "}
                    <a
                      href={sendResults.groupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {sendResults.groupLink}
                    </a>
                  </p>
                </div>
              )}

              {sendMethod === "manual" && (
                <div className="space-y-3 text-sm text-blue-800">
                  <p>
                    <strong>Method:</strong> Manual Copy & Paste
                  </p>
                  <p>
                    <strong>Recipients:</strong> {sendResults.recipientCount}
                  </p>
                  <div className="mt-3 p-3 bg-white rounded border border-blue-200">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Message to send:</p>
                    <p className="text-sm whitespace-pre-wrap text-slate-700">{sendResults.messageToSend}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sendResults.messageToSend);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }}
                    className="mt-2 flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy Message"}
                  </button>
                </div>
              )}

              <button
                onClick={resetResults}
                className="mt-4 w-full rounded border border-blue-300 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Send to More Recipients
              </button>
            </div>
          )}

          {/* Participant Selection */}
          {!sendResults && (
            <>
              {isLoadingParticipants ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="mr-2 animate-spin text-slate-500" size={18} />
                  <p className="text-slate-600">Loading participants...</p>
                </div>
              ) : participants.length > 0 ? (
                <>
                  {/* Select All Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <Users size={16} />
                      {selectedRecipients.size === participants.length ? "Deselect All" : "Select All"}
                    </button>
                    <span className="text-sm text-slate-600">
                      {selectedRecipients.size} of {participants.length} selected
                    </span>
                  </div>

                  {/* Participant List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
                    {participants.map((participant) => (
                      <label
                        key={participant.mobile}
                        className="flex items-start gap-3 rounded-lg p-3 hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRecipients.has(participant.mobile)}
                          onChange={() => toggleRecipient(participant.mobile)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{participant.name}</p>
                          <p className="text-xs text-slate-600">{participant.mobile}</p>
                          {participant.teamName && (
                            <p className="text-xs text-slate-500">Team: {participant.teamName}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Info Box */}
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Two ways to send:</strong>
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-blue-800">
                      <li>
                        🤖 <strong>API Method:</strong> Automatically send via WhatsApp Business API (if configured)
                      </li>
                      <li>
                        📋 <strong>Manual Method:</strong> Copy message and paste in WhatsApp (always works)
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto mb-2 text-slate-400" size={24} />
                  <p className="text-slate-600">No participants available</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Buttons */}
        {!sendResults && participants.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3">
            <button
              onClick={() => {
                setIsOpen(false);
                resetResults();
              }}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>

            {/* Manual Method Button */}
            <button
              onClick={handleManualCopy}
              disabled={selectedRecipients.size === 0 || isSending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy & Paste Method
                </>
              )}
            </button>

            {/* API Method Button */}
            <button
              onClick={handleSendViaAPI}
              disabled={selectedRecipients.size === 0 || isSending}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send via API
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
