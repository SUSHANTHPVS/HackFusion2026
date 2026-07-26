import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { api } from "../services/api";

const EVENT_FILTER_OPTIONS = [
  "",
  "WEBHOOK_RECEIVED",
  "WEBHOOK_CAPTURED",
  "WEBHOOK_FAILED",
  "WEBHOOK_REFUND",
  "WEBHOOK_DISPUTE"
];
const STATUS_FILTER_OPTIONS = ["", "info", "success", "failed"];

function getErrorMessage(error, fallback = "Unable to load webhook events") {
  return error?.response?.data?.message || fallback;
}

function WebhookCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{item.eventType}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900 capitalize">{item.status}</h3>
        </div>
        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order ID</dt>
          <dd className="mt-1 break-all text-slate-800">{item.orderId || "N/A"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment ID</dt>
          <dd className="mt-1 break-all text-slate-800">{item.payload?.paymentId || "N/A"}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-slate-700">{item.message}</p>
    </article>
  );
}

function RecoveryCard({ item, isRecovering, onCreateRecoveryOrder }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{item.teamId?.name || "N/A"}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{item.userId?.name || "N/A"}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
          {item.status}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order ID</dt>
          <dd className="mt-1 break-all text-slate-800">{item.orderId || "N/A"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
          <dd className="mt-1 text-slate-800">{new Date(item.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onCreateRecoveryOrder(item._id)}
        disabled={isRecovering || item.status === "success"}
        className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRecovering ? "Creating..." : "Create Recovery Order"}
      </button>
    </article>
  );
}

export function AdminPaymentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [eventType, setEventType] = useState("");
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState([]);
  const [recoveryQueue, setRecoveryQueue] = useState([]);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveringPaymentId, setRecoveringPaymentId] = useState("");

  const loadWebhookEvents = async ({ showRefreshing = false } = {}) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const params = { limit: 100 };
      if (eventType) {
        params.eventType = eventType;
      }
      if (status) {
        params.status = status;
      }

      const response = await api.get("/admin/payments/webhooks", { params });
      setLogs(response.data?.logs || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadRecoveryQueue = async () => {
    setRecoveryError("");

    try {
      const response = await api.get("/admin/payments/recovery-queue", {
        params: {
          status: "created,failed",
          limit: 50
        }
      });

      setRecoveryQueue(response.data?.queue || []);
    } catch (err) {
      setRecoveryError(getErrorMessage(err, "Unable to load payment recovery queue"));
    }
  };

  const createRecoveryOrder = async (paymentId) => {
    setRecoveryMessage("");
    setRecoveryError("");
    setRecoveringPaymentId(paymentId);

    try {
      const response = await api.post(`/admin/payments/${paymentId}/recovery-order`);
      const orderId = response.data?.order?.id || response.data?.payment?.orderId || "";
      setRecoveryMessage(orderId ? `Recovery order created: ${orderId}` : "Recovery order created successfully.");
      await loadRecoveryQueue();
      await loadWebhookEvents({ showRefreshing: true });
    } catch (err) {
      setRecoveryError(getErrorMessage(err, "Unable to create recovery order"));
    } finally {
      setRecoveringPaymentId("");
    }
  };

  useEffect(() => {
    Promise.all([loadWebhookEvents(), loadRecoveryQueue()]);
  }, [eventType, status]);

  const stats = useMemo(() => {
    return logs.reduce(
      (acc, item) => {
        if (item.status === "success") {
          acc.success += 1;
        } else if (item.status === "failed") {
          acc.failed += 1;
        } else {
          acc.info += 1;
        }

        if (item.eventType === "WEBHOOK_REFUND") {
          acc.refund += 1;
        }

        if (item.eventType === "WEBHOOK_DISPUTE") {
          acc.dispute += 1;
        }

        return acc;
      },
      { success: 0, failed: 0, info: 0, refund: 0, dispute: 0 }
    );
  }, [logs]);

  if (isLoading) {
    return (
      <div className="glass-card flex min-h-56 items-center justify-center rounded-2xl p-6 text-slate-700">
        <Loader2 className="mr-2 animate-spin" size={18} />
        {"Loading webhook deliveries..."}
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Monitoring</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Webhook Deliveries</h1>
        <p className="mt-3 text-slate-700">
          Recent Razorpay webhook events with delivery outcomes and linked payment identifiers.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Event Type
              <select
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {EVENT_FILTER_OPTIONS.map((value) => (
                  <option key={value || "all-events"} value={value}>
                    {value || "All"}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {STATUS_FILTER_OPTIONS.map((value) => (
                  <option key={value || "all-status"} value={value}>
                    {value || "All"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => loadWebhookEvents({ showRefreshing: true })}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Success</p>
            <p className="mt-1 text-xl font-bold text-emerald-800">{stats.success}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Info</p>
            <p className="mt-1 text-xl font-bold text-amber-800">{stats.info}</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Failed</p>
            <p className="mt-1 text-xl font-bold text-rose-800">{stats.failed}</p>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Refund</p>
            <p className="mt-1 text-xl font-bold text-sky-800">{stats.refund}</p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Dispute</p>
            <p className="mt-1 text-xl font-bold text-violet-800">{stats.dispute}</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No webhook events found for the selected filters.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:hidden">
              {logs.map((item) => (
                <WebhookCard key={item._id} item={item} />
              ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Payment ID</th>
                  <th className="px-3 py-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((item) => (
                  <tr key={item._id}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{item.eventType}</td>
                    <td className="px-3 py-2 capitalize text-slate-700">{item.status}</td>
                    <td className="max-w-55 truncate px-3 py-2 text-slate-700" title={item.orderId}>{item.orderId}</td>
                    <td className="max-w-55 truncate px-3 py-2 text-slate-700" title={item.payload?.paymentId || ""}>
                      {item.payload?.paymentId || "N/A"}
                    </td>
                    <td className="max-w-[320px] truncate px-3 py-2 text-slate-700" title={item.message}>{item.message}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment Recovery Queue</h2>
            <p className="mt-1 text-sm text-slate-600">Created/failed payments that can be retried via new Razorpay orders.</p>
          </div>
          <button
            type="button"
            onClick={loadRecoveryQueue}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh Queue
          </button>
        </div>

        {recoveryError ? <p className="mt-4 text-sm font-medium text-rose-600">{recoveryError}</p> : null}
        {recoveryMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{recoveryMessage}</p> : null}

        {recoveryQueue.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No pending recovery payments right now.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:hidden">
              {recoveryQueue.map((item) => {
                const isRecovering = recoveringPaymentId === item._id;

                return (
                  <RecoveryCard
                    key={item._id}
                    item={item}
                    isRecovering={isRecovering}
                    onCreateRecoveryOrder={createRecoveryOrder}
                  />
                );
              })}
            </div>

            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Participant</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Updated</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recoveryQueue.map((item) => {
                  const isRecovering = recoveringPaymentId === item._id;

                  return (
                    <tr key={item._id}>
                      <td className="px-3 py-2 text-slate-800">{item.teamId?.name || "N/A"}</td>
                      <td className="px-3 py-2 text-slate-700">{item.userId?.name || "N/A"}</td>
                      <td className="px-3 py-2 capitalize text-slate-700">{item.status}</td>
                      <td className="max-w-55 truncate px-3 py-2 text-slate-700" title={item.orderId}>{item.orderId}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">{new Date(item.updatedAt).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => createRecoveryOrder(item._id)}
                          disabled={isRecovering || item.status === "success"}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRecovering ? "Creating..." : "Create Recovery Order"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
