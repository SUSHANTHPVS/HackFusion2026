import React, { useState, useEffect } from "react";
import { Mail, Send, Copy, AlertCircle, CheckCircle, X, Loader } from "lucide-react";
import { api } from "../services/api";

export function EmailRegistrationSender() {
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState(new Set());
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendMethod, setSendMethod] = useState("email");
  const [sendResults, setSendResults] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const response = await api.get("/admin/email/participants");
      setParticipants(response.data.participants);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load participants");
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const toggleRecipient = (email) => {
    const newSet = new Set(selectedRecipients);
    if (newSet.has(email)) {
      newSet.delete(email);
    } else {
      newSet.add(email);
    }
    setSelectedRecipients(newSet);
  };

  const handleSelectAll = () => {
    const validEmails = participants
      .filter(p => p.hasEmail && p.email !== "NOT PROVIDED")
      .map(p => p.email);
    setSelectedRecipients(new Set(validEmails));
  };

  const handleDeselectAll = () => {
    setSelectedRecipients(new Set());
  };

  const handleSendEmails = async () => {
    if (selectedRecipients.size === 0) {
      setError("Please select at least one recipient");
      return;
    }

    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      // Filter out participants without valid emails
      const recipientEmails = Array.from(selectedRecipients).filter(
        email => email !== "NOT PROVIDED"
      );

      if (recipientEmails.length === 0) {
        setError("No valid email addresses selected");
        setIsSending(false);
        return;
      }

      const response = await api.post("/admin/email/send-registration", {
        recipientEmails
      });

      setSendMethod("email");
      setSendResults(response.data);
      setSuccess(
        `✅ Emails sent! ${response.data.successful} successful, ${response.data.failed || 0} failed`
      );
      setSelectedRecipients(new Set());
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send emails");
    } finally {
      setIsSending(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedRecipients(new Set());
    setSendResults(null);
    setError("");
    setSuccess("");
  };

  return (
    <>
      {/* Button to open modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        <Mail size={20} />
        Send Registration Email
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Send Registration Email
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Send hackathon registration confirmation and WhatsApp group link
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Success/Error Messages */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900">Error</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-semibold text-green-900">Success</h3>
                    <p className="text-green-700 text-sm">{success}</p>
                  </div>
                </div>
              )}

              {/* Results */}
              {sendResults && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    📧 Email Sending Results
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600">Successful:</span>
                      <span className="ml-2 font-bold text-green-600">
                        {sendResults.successful}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600">Failed:</span>
                      <span className="ml-2 font-bold text-red-600">
                        {sendResults.failed || 0}
                      </span>
                    </div>
                  </div>
                  {sendResults.errors && sendResults.errors.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-2">
                        Failed Recipients:
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        {sendResults.errors.map((err, idx) => (
                          <li key={idx}>• {err.email}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Participants Selection */}
              {!isLoadingParticipants && participants.length > 0 && (
                <>
                  {/* Select All / Deselect All */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedRecipients.size > 0 &&
                          selectedRecipients.size ===
                            participants.filter(
                              p => p.hasEmail && p.email !== "NOT PROVIDED"
                            ).length
                        }
                        readOnly
                      />
                      Select All
                    </button>
                    <div className="text-sm font-semibold text-slate-600">
                      {selectedRecipients.size} of{" "}
                      {
                        participants.filter(
                          p => p.hasEmail && p.email !== "NOT PROVIDED"
                        ).length
                      }{" "}
                      selected
                    </div>
                  </div>

                  {/* Participant List */}
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
                    {participants.map(participant => {
                      const hasEmail =
                        participant.hasEmail !== false &&
                        participant.email !== "NOT PROVIDED";
                      return (
                        <label
                          key={`${participant.email}-${participant.name}`}
                          className={`flex items-start gap-3 rounded-lg p-3 cursor-pointer ${
                            hasEmail ? "hover:bg-slate-50" : "bg-slate-50 opacity-60"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRecipients.has(participant.email)}
                            onChange={() => {
                              if (hasEmail) {
                                toggleRecipient(participant.email);
                              }
                            }}
                            disabled={!hasEmail}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {participant.name}
                              </p>
                              {!hasEmail && (
                                <span className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                  No Email
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-xs ${
                                hasEmail ? "text-slate-600" : "text-slate-400"
                              }`}
                            >
                              {hasEmail
                                ? participant.email
                                : "Email not provided"}
                            </p>
                            {participant.teamName && (
                              <p className="text-xs text-slate-500">
                                Team: {participant.teamName}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>📧 Email Content:</strong> Registration confirmation
                  with successful payment approval and WhatsApp group link
                </p>
              </div>

              {/* Loading State */}
              {isLoadingParticipants && (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin text-blue-600 mr-2" size={20} />
                  <span className="text-slate-600">Loading participants...</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200 sticky bottom-0 bg-white">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmails}
                disabled={isSending || selectedRecipients.size === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-colors"
              >
                {isSending ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Emails
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
