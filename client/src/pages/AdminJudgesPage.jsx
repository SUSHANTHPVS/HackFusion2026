import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load judges") {
  return error?.response?.data?.message || fallback;
}

function JudgeCard({ judge }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:hidden">
      <h3 className="text-base font-bold text-slate-900">{judge.name}</h3>
      <p className="mt-1 break-all text-sm text-slate-700">{judge.email}</p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department</dt>
          <dd className="mt-1 text-slate-800">{judge.department || "N/A"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teams Scored</dt>
          <dd className="mt-1 text-slate-800">{judge.teamsScored || 0}</dd>
        </div>
      </dl>
    </article>
  );
}

export function AdminJudgesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [judges, setJudges] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ email: "", name: "", department: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const loadJudges = async () => {
    setError("");

    try {
      const response = await api.get("/admin/judges");
      setJudges(response.data?.judges || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const payload = {
        email: form.email,
        name: form.name || undefined,
        department: form.department || undefined,
        password: form.password || undefined
      };

      const response = await api.post("/admin/judges", payload);
      setMessage(response.data?.message || "Judge updated.");
      setForm({ email: "", name: "", department: "", password: "" });
      await loadJudges();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update judge"));
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadJudges();
  }, []);

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Management</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Judges</h1>
        <p className="mt-3 text-slate-700">Promote existing users to judges or create new judge accounts.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Current Judges</h2>
          {isLoading ? (
            <div className="mt-4 flex min-h-32 items-center text-slate-700">
              <Loader2 className="mr-2 animate-spin" size={18} /> Loading judges...
            </div>
          ) : judges.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No judges available.</p>
          ) : (
            <>
              <div className="mt-4 grid gap-3 md:hidden">
                {judges.map((judge) => (
                  <JudgeCard key={judge._id} judge={judge} />
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Dept</th>
                    <th className="px-3 py-2">Teams Scored</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {judges.map((judge) => (
                    <tr key={judge._id}>
                      <td className="px-3 py-2 font-semibold text-slate-900">{judge.name}</td>
                      <td className="px-3 py-2 text-slate-700">{judge.email}</td>
                      <td className="px-3 py-2 text-slate-700">{judge.department || "N/A"}</td>
                      <td className="px-3 py-2 text-slate-700">{judge.teamsScored || 0}</td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Add or Promote Judge</h2>
          <p className="mt-2 text-sm text-slate-600">
            If email already exists, the user is promoted to judge. For a new judge account, include password.
          </p>

          <form className="mt-5 grid gap-3" onSubmit={onSubmit}>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Judge email"
            />
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Name (optional for existing user)"
            />
            <input
              value={form.department}
              onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Department (optional)"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11"
                placeholder="Password (required for new account)"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
              <UserPlus size={16} /> {isSaving ? "Saving..." : "Save Judge"}
            </button>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
