import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { BRANCH_OPTIONS, GENDER_OPTIONS, YEAR_OPTIONS, getSectionOptionsForBranch } from "../utils/constants";

const tracks = [
  "AI for Smarter Living",
  "Technology for Social Good",
  "Smart & Sustainable Future",
  "Future of Healthcare & Well-being",
  "Smart Automation & Robotics Solutions"
];
const PARTICIPATION_OPTIONS = {
  individual: {
    label: "Individual Participation",
    fee: 50,
    subtitle: "Solo registration"
  },
  team: {
    label: "Team Participation (2-4)",
    fee: 200,
    subtitle: "Leader + 1 to 3 teammates"
  }
};

function createTeamAndOrder(payload) {
  return api.post("/registration/team", payload).then((res) => res.data);
}

export function HackathonRegistrationPage() {
  const { isAuthenticated, user } = useAuth();
  const [participationType, setParticipationType] = useState("individual");
  const [teamName, setTeamName] = useState("");
  const [teamLeaderName, setTeamLeaderName] = useState(user?.name || "");
  const [rollNo, setRollNo] = useState("");
  const [leaderGender, setLeaderGender] = useState(GENDER_OPTIONS[0].value);
  const [year, setYear] = useState(YEAR_OPTIONS[0]);
  const [branch, setBranch] = useState(BRANCH_OPTIONS[0]);
  const [section, setSection] = useState(getSectionOptionsForBranch(BRANCH_OPTIONS[0])[0]);
  const [themeTrack, setThemeTrack] = useState(tracks[0]);
  const [teammates, setTeammates] = useState([
    {
      name: "",
      gender: GENDER_OPTIONS[0].value,
      rollNo: "",
      year: YEAR_OPTIONS[0],
      branch: BRANCH_OPTIONS[0],
      section: getSectionOptionsForBranch(BRANCH_OPTIONS[0])[0]
    }
  ]);
  const [orderData, setOrderData] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);

  const isUnauthorizedError = (error) => {
    if (error?.response?.status !== 401) {
      return false;
    }

    const message = String(error?.response?.data?.message || "").toLowerCase();
    return message.includes("unauthorized") || message.includes("invalid token");
  };

  const createOrderMutation = useMutation({
    mutationFn: createTeamAndOrder,
    onSuccess: (data) => {
      setRequiresLogin(false);
      setOrderData(data);

      if (data.paymentStatus === "success") {
        setPaymentMessage("Registration already completed for your account.");
      } else {
        setPaymentMessage("Team registered. Proceed to PhonePe payment.");
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        setOrderData(null);
        setRequiresLogin(true);
        setPaymentMessage("Authorization failed for this request. Please login again and retry registration.");
        return;
      }

      setRequiresLogin(false);
      setPaymentMessage(error?.response?.data?.message || "Could not create registration order.");
    }
  });

  const canPay = useMemo(
    () => Boolean(orderData?.paymentRedirectUrl && orderData?.paymentStatus === "created"),
    [orderData]
  );
  const selectedFee = PARTICIPATION_OPTIONS[participationType].fee;
  const totalMembers = 1 + (participationType === "team" ? teammates.length : 0);
  const checkoutDescription =
    participationType === "team"
      ? `Team Participation (${totalMembers} members) - INR ${selectedFee}`
      : `Individual Participation (1 member) - INR ${selectedFee}`;
  const leaderSectionOptions = useMemo(() => getSectionOptionsForBranch(branch), [branch]);

  const onBranchChange = (nextBranch) => {
    setBranch(nextBranch);
    const options = getSectionOptionsForBranch(nextBranch);
    setSection((current) => (options.includes(current) ? current : options[0]));
  };

  const updateTeammate = (index, field, value) => {
    setTeammates((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) {
          return item;
        }

        if (field === "branch") {
          const sectionOptions = getSectionOptionsForBranch(value);
          return {
            ...item,
            branch: value,
            section: sectionOptions.includes(item.section) ? item.section : sectionOptions[0]
          };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const addTeammate = () => {
    setTeammates((prev) => {
      if (prev.length >= 3) return prev;
      return [
        ...prev,
        {
          name: "",
          gender: GENDER_OPTIONS[0].value,
          rollNo: "",
          year: YEAR_OPTIONS[0],
          branch: BRANCH_OPTIONS[0],
          section: getSectionOptionsForBranch(BRANCH_OPTIONS[0])[0]
        }
      ];
    });
  };

  const removeTeammate = (index) => {
    setTeammates((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onCreateOrder = (event) => {
    event.preventDefault();
    setPaymentMessage("");
    setRequiresLogin(false);

    const normalizedTeammates = teammates.map((item) => ({
      name: item.name.trim(),
      gender: item.gender,
      rollNo: item.rollNo.trim().toUpperCase(),
      year: item.year.trim(),
      branch: item.branch.trim(),
      section: item.section.trim()
    }));

    const filledTeammates = normalizedTeammates.filter(
      (item) => item.name && item.rollNo && item.year && item.branch && item.section
    );

    if (!teamName.trim() || !teamLeaderName.trim() || !rollNo.trim() || !year.trim() || !branch.trim() || !section.trim()) {
      setPaymentMessage("Team and participant details are required before payment.");
      return;
    }

    if (participationType === "team") {
      if (filledTeammates.length !== teammates.length) {
        setPaymentMessage("Each teammate row must include name, roll no, year, branch, and section, or remove the row.");
        return;
      }

      if (filledTeammates.length < 1 || filledTeammates.length > 3) {
        setPaymentMessage("Team participation requires 1 to 3 teammates (2 to 4 total members including leader).");
        return;
      }

      const leaderRollNo = rollNo.trim().toUpperCase();
      const leaderNameNormalized = teamLeaderName.trim().toLowerCase();
      const teammateRollNos = filledTeammates.map((item) => item.rollNo);
      const teammateNames = filledTeammates.map((item) => item.name.toLowerCase());

      if (teammateRollNos.includes(leaderRollNo)) {
        setPaymentMessage("Team leader roll number cannot be used by a teammate.");
        return;
      }

      if (teammateNames.includes(leaderNameNormalized)) {
        setPaymentMessage("Team leader name cannot be duplicated in teammate entries.");
        return;
      }

      if (new Set(teammateRollNos).size !== teammateRollNos.length) {
        setPaymentMessage("Duplicate teammate roll numbers are not allowed.");
        return;
      }

      if (new Set(teammateNames).size !== teammateNames.length) {
        setPaymentMessage("Duplicate teammate names are not allowed.");
        return;
      }
    }

    createOrderMutation.mutate({
      participationType,
      teamName: teamName.trim(),
      teamLeaderName: teamLeaderName.trim(),
      leaderGender,
      rollNo: rollNo.trim(),
      year: year.trim(),
      branch: branch.trim(),
      section: section.trim(),
      themeTrack,
      teammates: participationType === "team" ? filledTeammates : []
    });
  };

  const onPayNow = () => {
    if (!orderData?.paymentRedirectUrl) return;
    // Redirect the browser to PhonePe's hosted payment page.
    window.location.href = orderData.paymentRedirectUrl;
  };

  if (!isAuthenticated) {
    return (
      <section className="glass-card mx-auto max-w-2xl rounded-2xl p-6">
        <h1 className="text-3xl font-bold">Hackathon Registration</h1>
        <p className="mt-3 text-slate-700">
          To start the hackathon registration and payment process, create your participant account first and then login.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
            Create Account
          </Link>
          <Link to="/login" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-800">
            Login
          </Link>
        </div>
      </section>
    );
  }

  if (user?.role !== "participant") {
    return (
      <section className="glass-card mx-auto max-w-2xl rounded-2xl p-6">
        <h1 className="text-3xl font-bold">Hackathon Registration</h1>
        <p className="mt-3 text-slate-700">Only participant accounts can register for teams and make registration payments.</p>
      </section>
    );
  }

  return (
    <section className="glass-card mx-auto max-w-2xl rounded-2xl p-6">
      <h1 className="text-3xl font-bold">Hackathon Registration & Payment</h1>
      <p className="mt-2 text-slate-700">One login creates one registration profile. Fill details, create order, then complete PhonePe payment.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {Object.entries(PARTICIPATION_OPTIONS).map(([type, option]) => {
          const selected = participationType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => {
                setParticipationType(type);
                setPaymentMessage("");
                setOrderData(null);
                if (type === "individual") {
                  setTeammates([
                    {
                      name: "",
                      gender: GENDER_OPTIONS[0].value,
                      rollNo: "",
                      year: YEAR_OPTIONS[0],
                      branch: BRANCH_OPTIONS[0],
                      section: getSectionOptionsForBranch(BRANCH_OPTIONS[0])[0]
                    }
                  ]);
                }
              }}
              className={`rounded-xl border p-4 text-left transition ${
                selected ? "border-cyan-600 bg-cyan-50" : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-wide text-slate-600">{option.label}</p>
              <p className="mt-1 text-xs text-slate-500">{option.subtitle}</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-900">INR {option.fee}</p>
            </button>
          );
        })}
      </div>

      <form className="mt-6 grid gap-4" onSubmit={onCreateOrder}>
        <input
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Team Name"
          required
        />

        <input
          value={teamLeaderName}
          onChange={(event) => setTeamLeaderName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Team Leader Name"
          required
        />

        <input
          value={rollNo}
          onChange={(event) => setRollNo(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Roll No"
          required
        />

        <select
          value={leaderGender}
          onChange={(event) => setLeaderGender(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
          required
        >
          {GENDER_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="grid gap-4 sm:grid-cols-3">
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            required
          >
            {YEAR_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={branch}
            onChange={(event) => onBranchChange(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            required
          >
            {BRANCH_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={section}
            onChange={(event) => setSection(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
            required
          >
            {leaderSectionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <select
          value={themeTrack}
          onChange={(event) => setThemeTrack(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2"
        >
          {tracks.map((track) => (
            <option key={track} value={track}>
              {track}
            </option>
          ))}
        </select>

        {participationType === "team" && (
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Team Members</h2>
              <button
                type="button"
                onClick={addTeammate}
                disabled={teammates.length >= 3}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Member
              </button>
            </div>

            <p className="mb-3 text-xs text-slate-500">Add 1 to 3 teammates with full details. Maximum team size is 4 including leader.</p>

            <div className="grid gap-3">
              {teammates.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-slate-100 p-3">
                  <input
                    value={item.name}
                    onChange={(event) => updateTeammate(index, "name", event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    placeholder={`Member ${index + 1} Name`}
                  />
                  <select
                    value={item.gender}
                    onChange={(event) => updateTeammate(index, "gender", event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    value={item.rollNo}
                    onChange={(event) => updateTeammate(index, "rollNo", event.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Roll No"
                  />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select
                      value={item.year}
                      onChange={(event) => updateTeammate(index, "year", event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    >
                      {YEAR_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      value={item.branch}
                      onChange={(event) => updateTeammate(index, "branch", event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    >
                      {BRANCH_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      value={item.section}
                      onChange={(event) => updateTeammate(index, "section", event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    >
                      {getSectionOptionsForBranch(item.branch).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTeammate(index)}
                    disabled={teammates.length === 1}
                    className="justify-self-start rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-600">Current team size: {totalMembers}/4</p>
          </div>
        )}

        {participationType === "individual" && (
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
            Individual participation selected. You will register as a solo participant.
          </div>
        )}

        <button
          type="submit"
          disabled={createOrderMutation.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
        >
          {createOrderMutation.isPending ? "Creating Order..." : `Create Registration Order (INR ${selectedFee})`}
        </button>
      </form>

      {canPay && (
        <button
          type="button"
          onClick={onPayNow}
          className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white"
        >
          Pay Now via PhonePe (INR {selectedFee})
        </button>
      )}

      {requiresLogin && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p>Login is required to continue registration and payment.</p>
          <div className="mt-2">
            <Link to="/login?redirect=/hackathon-register" className="font-semibold underline">
              Go to Login
            </Link>
          </div>
        </div>
      )}

      {paymentMessage && <p className="mt-4 text-sm text-slate-700">{paymentMessage}</p>}

      {!requiresLogin && paymentMessage.includes("Unable to initiate payment order") && (
        <p className="mt-2 text-xs text-slate-500">
          Organizer note: set valid PhonePe credentials in server environment (`PHONEPE_MERCHANT_ID`, `PHONEPE_SALT_KEY`) and restart backend.
        </p>
      )}

      {orderData?.transactionId && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Payment Diagnostics</p>
          <div className="mt-2 grid gap-1 text-xs text-slate-700">
            <p>Transaction ID: {orderData.transactionId}</p>
            <p>Amount: INR {orderData.feeInr}</p>
          </div>
        </div>
      )}
    </section>
  );
}
