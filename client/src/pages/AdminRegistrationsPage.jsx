import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search, X } from "lucide-react";
import * as XLSX from "xlsx";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load registrations") {
  return error?.response?.data?.message || fallback;
}

const EXPORT_HEADERS = ["TeamName", "Team Mates Names", "Roll Number", "Branch", "Section", "IEEE Member ID"];

function getAllMembers(item) {
  return [
    {
      role: "Team Leader",
      name: item.teamLeaderName || item.leaderName || "N/A",
      rollNo: item.rollNo || "N/A",
      branch: item.branch || "N/A",
      section: item.section || "N/A",
      ieeeMemberId: item.ieeeMemberId || ""
    },
    ...(item.teammates || []).map((member, index) => ({
      role: `Teammate ${index + 1}`,
      name: member.name || "N/A",
      rollNo: member.rollNo || "N/A",
      branch: member.branch || "N/A",
      section: member.section || "N/A",
      ieeeMemberId: member.ieeeMemberId || ""
    }))
  ];
}

function buildCsvValue(values) {
  return values.filter(Boolean).join(", ") || "N/A";
}

function buildExportRows(rows) {
  return rows.map((item) => {
    const members = getAllMembers(item);

    return {
      TeamName: item.teamName || "N/A",
      "Team Mates Names": buildCsvValue(members.map((member) => member.name || "N/A")),
      "Roll Number": buildCsvValue(members.map((member) => member.rollNo || "N/A")),
      Branch: buildCsvValue(members.map((member) => member.branch || "N/A")),
      Section: buildCsvValue(members.map((member) => member.section || "N/A")),
      "IEEE Member ID": buildCsvValue(members.map((member) => member.ieeeMemberId || "N/A"))
    };
  });
}

function buildParticipantExportRows(rows) {
  return rows.flatMap((item) => {
    const members = getAllMembers(item);

    return members.map((member) => ({
      TeamName: item.teamName || "N/A",
      "Team Mates Names": member.name || "N/A",
      "Roll Number": member.rollNo || "N/A",
      Branch: member.branch || "N/A",
      Section: member.section || "N/A",
      "IEEE Member ID": member.ieeeMemberId || "N/A"
    }));
  });
}

// Detailed participant information modal
function getTeamMembersWithKeys(item) {
  return [
    {
      key: "leader",
      label: "Team Leader",
      name: item.teamLeaderName || item.leaderName || "N/A",
      rollNo: item.rollNo || "N/A",
      checkedIn: Boolean(item.checkedIn)
    },
    ...(item.teammates || []).map((member, index) => ({
      key: `teammate-${index}`,
      label: `Teammate ${index + 1}`,
      name: member.name || "N/A",
      rollNo: member.rollNo || "N/A",
      checkedIn: Boolean(member.checkedIn)
    }))
  ];
}

function ParticipantDetailModal({ item, isMarking, onTogglePresence, onBulkTogglePresence, onClose }) {
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [item?.teamId]);

  if (!item) return null;

  const members = getTeamMembersWithKeys(item);
  const isAllMembersSelected = members.length > 0 && members.every((member) => selectedKeys.has(member.key));

  const toggleMemberKey = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAllMembers = () => {
    setSelectedKeys((prev) => {
      const allSelected = members.length > 0 && members.every((member) => prev.has(member.key));
      return allSelected ? new Set() : new Set(members.map((member) => member.key));
    });
  };

  const handleBulkMembers = (checkedIn) => {
    if (selectedKeys.size === 0) {
      return;
    }
    onBulkTogglePresence(item.teamId, Array.from(selectedKeys), checkedIn);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 bg-linear-to-r from-cyan-50 to-blue-50 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Team Details</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.teamName}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-200">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Payment & Participation Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Payment Status</p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-900">{item.paymentStatus}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Payment Amount</p>
              <p className="mt-1 text-sm font-bold text-slate-900">₹{item.paymentAmountInr || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Participation Type</p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-900">{item.participationType || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Theme Track</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{item.themeTrack || "N/A"}</p>
            </div>
          </div>

          {/* Team Members Presence - checkboxes with select-all */}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-800">
                Mark Presence ({members.length} member{members.length === 1 ? "" : "s"})
              </p>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAllMembersSelected}
                  disabled={item.paymentStatus !== "success"}
                  onChange={toggleSelectAllMembers}
                  className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
                />
                Select All
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {members.map((member) => (
                <label
                  key={member.key}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(member.key)}
                    disabled={item.paymentStatus !== "success"}
                    onChange={() => toggleMemberKey(member.key)}
                    className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-900">{member.name}</span>
                    <span className="block text-xs text-slate-500">
                      {member.label} • {member.rollNo}
                    </span>
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      member.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {member.checkedIn ? "Present" : "Pending"}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleBulkMembers(true)}
                disabled={selectedKeys.size === 0 || isMarking}
                className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarking ? "Updating..." : "Mark Selected Present"}
              </button>
              <button
                type="button"
                onClick={() => handleBulkMembers(false)}
                disabled={selectedKeys.size === 0 || isMarking}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isMarking ? "Updating..." : "Remove Selected Presence"}
              </button>
            </div>
          </div>

          {/* Team Leader Info */}
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-900">Team Leader</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-blue-700">Name</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.teamLeaderName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Email</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">{item.accountEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Mobile</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.accountMobile || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Roll No</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.rollNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Year</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.year || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Branch</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.branch || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Section</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.section || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Presence Status</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {item.checkedIn ? "Present" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Team Members Info */}
          {item.teammates && item.teammates.length > 0 && (
            <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-purple-900">Team Members ({item.teammates.length})</p>
              <div className="space-y-3">
                {item.teammates.map((member, idx) => (
                  <div key={idx} className="rounded bg-white p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div>
                        <p className="font-semibold text-purple-700">Name</p>
                        <p className="mt-0.5 text-slate-900">{member.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">Roll No</p>
                        <p className="mt-0.5 text-slate-900">{member.rollNo || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">Year</p>
                        <p className="mt-0.5 text-slate-900">{member.year || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">Branch</p>
                        <p className="mt-0.5 text-slate-900">{member.branch || "N/A"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="font-semibold text-purple-700">Section</p>
                        <p className="mt-0.5 text-slate-900">{member.section || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Details */}
          {item.orderId && (
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-900">Payment Information</p>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-emerald-700">Order ID</p>
                  <p className="mt-0.5 break-all font-mono text-slate-900">{item.orderId}</p>
                </div>
                <div>
                  <p className="font-semibold text-emerald-700">Payment ID</p>
                  <p className="mt-0.5 break-all font-mono text-slate-900">{item.paymentId || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onTogglePresence(item.leaderId, !item.checkedIn)}
            disabled={!item.leaderId || isMarking || item.paymentStatus !== "success"}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMarking ? "Updating..." : item.checkedIn ? "Remove Present" : "Mark Present"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrationCard({ item, isMarking, isSelected, isSelectable, onTogglePresence, onViewDetails, onToggleSelect }) {
  const memberSummary = getAllMembers(item)
    .map((member) => `${member.role}: ${member.name} (${member.rollNo}, ${member.branch}, ${member.section})`)
    .join(" • ");

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            disabled={!isSelectable}
            onChange={() => onToggleSelect(item.leaderId)}
            className="mt-1 h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Select ${item.teamName}`}
          />
          <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{item.teamName}</p>

      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
        <p className="font-semibold uppercase tracking-wide text-slate-500">Team Details</p>
        <p className="mt-1 leading-5">{memberSummary}</p>
      </div>
          <h3 className="mt-1 text-base font-bold text-slate-900">{item.teamLeaderName}</h3>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            item.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {item.checkedIn ? "Present" : "Pending"}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
          <dd className="mt-1 break-all text-slate-800">{item.accountEmail || "N/A"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</dt>
          <dd className="mt-1 capitalize text-slate-800">{item.paymentStatus}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(item)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onTogglePresence(item.leaderId, !item.checkedIn)}
          disabled={!item.leaderId || isMarking || item.paymentStatus !== "success"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMarking
            ? "Updating..."
            : item.checkedIn
              ? "Remove"
              : "Mark"}
        </button>
      </div>
    </article>
  );
}

export function AdminRegistrationsPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [isBulkMarking, setIsBulkMarking] = useState(false);
  const [checkinLoadingId, setCheckinLoadingId] = useState("");
  const [isTeamBulkMarking, setIsTeamBulkMarking] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const exportRows = useMemo(() => buildExportRows(rows), [rows]);
  const participantExportRows = useMemo(() => buildParticipantExportRows(rows), [rows]);
  const selectedItem = useMemo(
    () => rows.find((row) => row.teamId === selectedTeamId) || null,
    [rows, selectedTeamId]
  );
  const selectableIds = useMemo(
    () => rows.filter((row) => row.leaderId && row.paymentStatus === "success").map((row) => row.leaderId),
    [rows]
  );
  const isAllSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));

  const downloadExcel = () => {
    if (exportRows.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: EXPORT_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");
    XLSX.writeFile(workbook, "registrations-presence.xlsx");
  };

  const downloadParticipantExcel = () => {
    if (participantExportRows.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(participantExportRows, { header: EXPORT_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
    XLSX.writeFile(workbook, "registrations-presence-participant-wise.xlsx");
  };

  const loadRegistrations = async ({ refreshing = false } = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/admin/registrations/search", {
        params: {
          q: query,
          limit: 300,
          paymentStatus: "success"
        }
      });

      setRows(response.data?.rows || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const togglePresence = async (participantId, checkedIn) => {
    if (!participantId) {
      return;
    }

    setActionMessage("");
    setError("");
    setCheckinLoadingId(participantId);

    try {
      await api.post("/checkin/scan", { participantId, checkedIn });
      setActionMessage(checkedIn ? "Presence marked successfully." : "Presence removed successfully.");
      setSelectedTeamId(null);
      await loadRegistrations({ refreshing: true });
    } catch (err) {
      setError(getErrorMessage(err, checkedIn ? "Failed to mark presence" : "Failed to remove presence"));
    } finally {
      setCheckinLoadingId("");
    }
  };

  const toggleSelect = (participantId) => {
    if (!participantId) {
      return;
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(selectableIds);
    });
  };

  const bulkMarkPresence = async (checkedIn) => {
    if (selectedIds.size === 0) {
      return;
    }

    setActionMessage("");
    setError("");
    setIsBulkMarking(true);

    try {
      await api.post("/checkin/bulk-scan", {
        participantIds: Array.from(selectedIds),
        checkedIn
      });
      setActionMessage(checkedIn ? "Presence marked for all selected participants." : "Presence removed for all selected participants.");
      setSelectedIds(new Set());
      await loadRegistrations({ refreshing: true });
    } catch (err) {
      setError(getErrorMessage(err, checkedIn ? "Failed to mark presence" : "Failed to remove presence"));
    } finally {
      setIsBulkMarking(false);
    }
  };

  const bulkToggleTeamMembers = async (teamId, memberKeys, checkedIn) => {
    if (!teamId || memberKeys.length === 0) {
      return;
    }

    setActionMessage("");
    setError("");
    setIsTeamBulkMarking(true);

    try {
      await api.post("/checkin/team-bulk-scan", { teamId, memberKeys, checkedIn });
      setActionMessage(checkedIn ? "Presence marked for selected team members." : "Presence removed for selected team members.");
      await loadRegistrations({ refreshing: true });
    } catch (err) {
      setError(getErrorMessage(err, checkedIn ? "Failed to mark presence" : "Failed to remove presence"));
    } finally {
      setIsTeamBulkMarking(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Control</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Registrations and Presence</h1>
        <p className="mt-3 text-slate-700">View paid registrations and confirm participant presence on hackathon day. Only teams with successful payment are shown.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-lg items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team, leader, roll no, branch..."
              className="w-full border-none bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadExcel}
              disabled={exportRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} /> Download Excel (Team-wise)
            </button>
            <button
              type="button"
              onClick={downloadParticipantExcel}
              disabled={participantExportRows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} /> Download Excel (Participant-wise)
            </button>
            <button
              type="button"
              onClick={() => loadRegistrations({ refreshing: true })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadRegistrations({ refreshing: true })}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Apply Search
          </button>
          <label className="ml-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={isAllSelected}
              disabled={selectableIds.length === 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
            />
            Select All ({selectedIds.size}/{selectableIds.length})
          </label>
          <button
            type="button"
            onClick={() => bulkMarkPresence(true)}
            disabled={selectedIds.size === 0 || isBulkMarking}
            className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBulkMarking ? "Updating..." : "Mark Selected Present"}
          </button>
          <button
            type="button"
            onClick={() => bulkMarkPresence(false)}
            disabled={selectedIds.size === 0 || isBulkMarking}
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBulkMarking ? "Updating..." : "Remove Selected Presence"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
        {actionMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{actionMessage}</p> : null}

        {isLoading ? (
          <div className="mt-4 flex min-h-40 items-center justify-center text-slate-700">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading registrations...
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No registrations found.</p>
        ) : (
          <>
            {/* Mobile View */}
            <div className="mt-4 grid gap-3 md:hidden">
              {rows.map((item) => {
                const isMarking = checkinLoadingId === item.leaderId;

                return (
                  <RegistrationCard
                    key={item.teamId}
                    item={item}
                    isMarking={isMarking}
                    isSelected={Boolean(item.leaderId) && selectedIds.has(item.leaderId)}
                    isSelectable={Boolean(item.leaderId) && item.paymentStatus === "success"}
                    onTogglePresence={togglePresence}
                    onViewDetails={(item) => setSelectedTeamId(item.teamId)}
                    onToggleSelect={toggleSelect}
                  />
                );
              })}
            </div>

            {/* Desktop View - Table */}
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={selectableIds.length === 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3 py-2">Team</th>
                    <th className="px-3 py-2">Leader</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Payment</th>
                    <th className="px-3 py-2">Presence</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rows.map((item) => {
                    const isMarking = checkinLoadingId === item.leaderId;
                    const isSelectable = Boolean(item.leaderId) && item.paymentStatus === "success";

                    return (
                      <tr key={item.teamId} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedTeamId(item.teamId)}>
                          <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={Boolean(item.leaderId) && selectedIds.has(item.leaderId)}
                              disabled={!isSelectable}
                              onChange={() => toggleSelect(item.leaderId)}
                              className="h-4 w-4 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Select ${item.teamName}`}
                            />
                          </td>
                          <td className="px-3 py-2 font-semibold text-slate-900">
                            <div>{item.teamName}</div>
                            <div className="mt-1 text-xs font-normal text-slate-600">
                              {getAllMembers(item)
                                .map((member) => `${member.role}: ${member.name} (${member.rollNo}, ${member.branch}, ${member.section})`)
                                .join(" • ")}
                            </div>
                          </td>
                        <td className="px-3 py-2 text-slate-700">{item.teamLeaderName}</td>
                        <td className="px-3 py-2 text-slate-700">{item.accountEmail || "N/A"}</td>
                        <td className="px-3 py-2 capitalize text-slate-700">{item.paymentStatus}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.checkedIn ? "Present" : "Pending"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePresence(item.leaderId, !item.checkedIn);
                            }}
                            disabled={!item.leaderId || isMarking || item.paymentStatus !== "success"}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isMarking ? "Updating..." : item.checkedIn ? "Remove Present" : "Mark Present"}
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

      {/* Participant Detail Modal */}
      {selectedItem && (
        <ParticipantDetailModal
          item={selectedItem}
          isMarking={checkinLoadingId === selectedItem.leaderId || isTeamBulkMarking}
          onTogglePresence={togglePresence}
          onBulkTogglePresence={bulkToggleTeamMembers}
          onClose={() => setSelectedTeamId(null)}
        />
      )}
    </section>
  );
}
