import { useEffect, useState } from "react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load settings") {
  return error?.response?.data?.message || fallback;
}

export function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState({
    registrationClosed: false,
    individualFeeInr: 50,
    teamFeeInr: 200
  });

  const loadHistory = async () => {
    try {
      const response = await api.get("/admin/settings/history", { params: { limit: 20 } });
      setHistory(response.data?.logs || []);
    } catch {
      setHistory([]);
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/settings");
      setSettings({
        registrationClosed: Boolean(response.data?.registrationClosed),
        individualFeeInr: Number(response.data?.individualFeeInr || 0),
        teamFeeInr: Number(response.data?.teamFeeInr || 0)
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const response = await api.patch("/admin/settings", settings);
      setMessage(response.data?.message || "Settings updated.");
      setSettings({
        registrationClosed: Boolean(response.data?.registrationClosed),
        individualFeeInr: Number(response.data?.individualFeeInr || 0),
        teamFeeInr: Number(response.data?.teamFeeInr || 0)
      });
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update settings"));
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    setError("");
    setMessage("");
    setIsResetting(true);

    try {
      const response = await api.post("/admin/settings/reset");
      setMessage(response.data?.message || "Settings reset to defaults.");
      setSettings({
        registrationClosed: Boolean(response.data?.registrationClosed),
        individualFeeInr: Number(response.data?.individualFeeInr || 0),
        teamFeeInr: Number(response.data?.teamFeeInr || 0)
      });
      await loadHistory();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to reset settings"));
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    Promise.all([loadSettings(), loadHistory()]);
  }, []);

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Settings</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Event Settings</h1>
        <p className="mt-3 text-slate-700">
          Manage registration status and participation fees with persistent database-backed settings.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="glass-card rounded-2xl p-6">
        {isLoading ? (
          <p className="text-sm text-slate-700">Loading settings...</p>
        ) : (
          <form className="grid gap-4" onSubmit={updateSettings}>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={settings.registrationClosed}
                onChange={(event) => setSettings((prev) => ({ ...prev, registrationClosed: event.target.checked }))}
              />
              Close new registrations
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Individual Fee (INR)
              <input
                type="number"
                min={0}
                value={settings.individualFeeInr}
                onChange={(event) => setSettings((prev) => ({ ...prev, individualFeeInr: Number(event.target.value || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Team Fee (INR)
              <input
                type="number"
                min={0}
                value={settings.teamFeeInr}
                onChange={(event) => setSettings((prev) => ({ ...prev, teamFeeInr: Number(event.target.value || 0) }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button disabled={isSaving} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
              {isSaving ? "Saving..." : "Save Settings"}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={resetSettings}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                {isResetting ? "Resetting..." : "Reset to Defaults"}
              </button>
            </div>

            <p className="text-xs text-slate-500">Updates are stored in MongoDB and remain after server restart.</p>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          </form>
        )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Settings Audit Log</h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No settings changes recorded yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {history.map((item) => (
                <div key={item._id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                  <p className="font-semibold text-slate-800">
                    {item.action === "reset" ? "Reset" : "Update"} by {item.changedBy?.name || item.changedByEmail || "Unknown"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                  <p className="mt-2 text-xs text-slate-600">
                    From: Closed={String(item.before?.registrationClosed)}, Individual={item.before?.individualFeeInr}, Team={item.before?.teamFeeInr}
                  </p>
                  <p className="text-xs text-slate-600">
                    To: Closed={String(item.after?.registrationClosed)}, Individual={item.after?.individualFeeInr}, Team={item.after?.teamFeeInr}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
