import { useState } from "react";
import { Download } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to generate certificate") {
  return error?.response?.data?.message || fallback;
}

export function AdminCertificatesPage() {
  const [winnerName, setWinnerName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const generateCertificate = async (event) => {
    event.preventDefault();
    setIsGenerating(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post(
        "/admin/certificates/winner",
        { winnerName: winnerName.trim(), teamName: teamName.trim() },
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `winner-certificate-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileUrl);

      setMessage("Certificate generated and downloaded.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Tools</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Certificates</h1>
        <p className="mt-3 text-slate-700">Generate winner certificates instantly as downloadable PDF files.</p>
      </div>

      <div className="glass-card mx-auto max-w-2xl rounded-2xl p-6">
        <form className="grid gap-4" onSubmit={generateCertificate}>
          <input
            required
            value={winnerName}
            onChange={(event) => setWinnerName(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Winner name"
          />
          <input
            required
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Team name"
          />

          <button disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
            <Download size={16} /> {isGenerating ? "Generating..." : "Generate Winner Certificate"}
          </button>

          {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
          {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
