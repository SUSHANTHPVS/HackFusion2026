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
const PAYMENT_MODE_OPTIONS = {
  upi_only: {
    label: "UPI Only",
    subtitle: "Pay via UPI"
  },
  all_methods: {
    label: "All Methods",
    subtitle: "UPI, Card, NetBanking, Wallet"
  }
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getPaymentAlert(message) {
  const normalized = String(message || "").toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized.includes("authorization failed") || normalized.includes("unauthorized")) {
    return {
      tone: "warning",
      title: "Login required",
      hint: "Your session is missing or expired. Log in again and retry the registration order."
    };
  }

  if (normalized.includes("unable to create payment order") || normalized.includes("razorpay credentials")) {
    return {
      tone: "danger",
      title: "Razorpay order setup failed",
      hint: "Check server/.env for RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart the backend."
    };
  }

  if (normalized.includes("payment failed") || normalized.includes("verification failed")) {
    return {
      tone: "danger",
      title: "Payment did not complete",
      hint: "Try the payment again. If this keeps happening, verify the order details in the backend logs."
    };
  }

  if (normalized.includes("payment verified")) {
    return {
      tone: "success",
      title: "Payment verified",
      hint: "The payment signature matched and the registration should now be complete."
    };
  }

  return {
    tone: "info",
    title: "Registration status",
    hint: message
  };
}

function createTeamAndOrder(payload) {
  return api.post("/registration/team", payload).then((res) => res.data);
}

function verifyPayment(paymentData) {
  const payload = {
    razorpay_order_id: paymentData?.razorpay_order_id,
    razorpay_payment_id: paymentData?.razorpay_payment_id,
    razorpay_signature: paymentData?.razorpay_signature
  };

  return api.post("/verify-payment", payload).then((res) => res.data);
}

function getInputClass(hasError) {
  return `rounded-lg border px-3 py-2 ${hasError ? "border-rose-500 focus:border-rose-500" : "border-slate-300"}`;
}

function createEmptyFieldErrors(teammateCount = 1) {
  return {
    teamName: "",
    teamLeaderName: "",
    rollNo: "",
    teammates: Array.from({ length: teammateCount }, () => ({ name: "", rollNo: "" }))
  };
}

function extractDuplicateFieldError(message, teammates) {
  const text = String(message || "").trim();
  if (!text) {
    return null;
  }

  const rollMatch = text.match(/^Roll number\s+(.+?)\s+is already registered with team\s+/i);
  if (rollMatch) {
    const duplicateRollNo = rollMatch[1]?.trim().toUpperCase();
    if (!duplicateRollNo) {
      return null;
    }

    const teammateIndex = teammates.findIndex((item) => item.rollNo.trim().toUpperCase() === duplicateRollNo);
    if (teammateIndex >= 0) {
      return { path: "teammates.rollNo", index: teammateIndex, message: text };
    }

    return { path: "rollNo", message: text };
  }

  const nameMatch = text.match(/^Name\s+(.+?)\s+is already registered with team\s+/i);
  if (nameMatch) {
    const duplicateName = nameMatch[1]?.trim().toLowerCase();
    if (!duplicateName) {
      return null;
    }

    const teammateIndex = teammates.findIndex((item) => item.name.trim().toLowerCase() === duplicateName);
    if (teammateIndex >= 0) {
      return { path: "teammates.name", index: teammateIndex, message: text };
    }

    return { path: "teamLeaderName", message: text };
  }

  return null;
}

export function HackathonRegistrationPage() {
  const { isAuthenticated, user } = useAuth();
  const [participationType, setParticipationType] = useState("individual");
  const [paymentMode, setPaymentMode] = useState("all_methods");
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
  const [fieldErrors, setFieldErrors] = useState(() => createEmptyFieldErrors(1));

  const isUnauthorizedError = (error) => {
    if (error?.response?.status !== 401) {
      return false;
    }

    const message = String(error?.response?.data?.message || "").toLowerCase();
    return message.includes("unauthorized") || message.includes("invalid token");
  };

  const verifyMutation = useMutation({
    mutationFn: verifyPayment,
    onSuccess: (data) => {
      setPaymentMessage("Payment verified! Registration successful.");
      setOrderData(null);
    },
    onError: (error) => {
      setPaymentMessage(error?.response?.data?.message || "Payment verification failed.");
    }
  });

  const createOrderMutation = useMutation({
    mutationFn: createTeamAndOrder,
    onSuccess: (data) => {
      setRequiresLogin(false);
      setOrderData(data);

      if (data.paymentStatus === "success") {
        setPaymentMessage("Registration already completed for your account.");
      } else {
        setPaymentMessage("Team registered. Proceed to Razorpay payment.");
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
      const serverMessage = error?.response?.data?.message || "Could not create registration order.";
      const duplicateError = extractDuplicateFieldError(serverMessage, teammates);

      if (duplicateError?.path === "rollNo") {
        setFieldErrors((prev) => ({ ...prev, rollNo: serverMessage }));
      } else if (duplicateError?.path === "teamLeaderName") {
        setFieldErrors((prev) => ({ ...prev, teamLeaderName: serverMessage }));
      } else if (duplicateError?.path === "teammates.rollNo" && duplicateError.index >= 0) {
        setFieldErrors((prev) => ({
          ...prev,
          teammates: prev.teammates.map((item, idx) =>
            idx === duplicateError.index ? { ...item, rollNo: serverMessage } : item
          )
        }));
      } else if (duplicateError?.path === "teammates.name" && duplicateError.index >= 0) {
        setFieldErrors((prev) => ({
          ...prev,
          teammates: prev.teammates.map((item, idx) =>
            idx === duplicateError.index ? { ...item, name: serverMessage } : item
          )
        }));
      }

      setPaymentMessage(serverMessage);
    }
  });

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || orderData?.keyId || "";
  const canPay = useMemo(
    () => Boolean(orderData?.order && razorpayKeyId && orderData?.paymentStatus === "created"),
    [orderData, razorpayKeyId]
  );
  const paymentAlert = useMemo(() => getPaymentAlert(paymentMessage), [paymentMessage]);
  const selectedFee = PARTICIPATION_OPTIONS[participationType].fee;
  const totalMembers = 1 + (participationType === "team" ? teammates.length : 0);
  const checkoutDescription =
    participationType === "team"
      ? `Team Participation (${totalMembers} members) - INR ${selectedFee}`
      : `Individual Participation (1 member) - INR ${selectedFee}`;
  const leaderSectionOptions = useMemo(() => getSectionOptionsForBranch(branch), [branch]);

  const resetFieldErrors = (teammateCount = teammates.length) => {
    setFieldErrors(createEmptyFieldErrors(teammateCount));
  };

  const onBranchChange = (nextBranch) => {
    setBranch(nextBranch);
    const options = getSectionOptionsForBranch(nextBranch);
    setSection((current) => (options.includes(current) ? current : options[0]));
  };

  const updateTeammate = (index, field, value) => {
    if (field === "name" || field === "rollNo") {
      setFieldErrors((prev) => ({
        ...prev,
        teammates: prev.teammates.map((item, idx) =>
          idx === index ? { ...item, [field]: "" } : item
        )
      }));
    }

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
      const next = [
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
      resetFieldErrors(next.length);
      return next;
    });
  };

  const removeTeammate = (index) => {
    setTeammates((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      resetFieldErrors(next.length);
      return next;
    });
  };

  const onCreateOrder = (event) => {
    event.preventDefault();
    setPaymentMessage("");
    setRequiresLogin(false);
    resetFieldErrors(teammates.length);

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
      setFieldErrors((prev) => ({
        ...prev,
        teamName: !teamName.trim() ? "Team name is required." : prev.teamName,
        teamLeaderName: !teamLeaderName.trim() ? "Team leader name is required." : prev.teamLeaderName,
        rollNo: !rollNo.trim() ? "Leader roll number is required." : prev.rollNo
      }));
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
        setFieldErrors((prev) => ({
          ...prev,
          rollNo: "Team leader roll number cannot be used by a teammate."
        }));
        setPaymentMessage("Team leader roll number cannot be used by a teammate.");
        return;
      }

      if (teammateNames.includes(leaderNameNormalized)) {
        setFieldErrors((prev) => ({
          ...prev,
          teamLeaderName: "Team leader name cannot be duplicated in teammate entries."
        }));
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

  const onPayNow = async () => {
    if (!orderData?.order || !razorpayKeyId) return;

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setPaymentMessage("Failed to load Razorpay. Please try again.");
      return;
    }

    const options = {
      key: razorpayKeyId,
      order_id: orderData.order.id,
      amount: orderData.order.amount,
      currency: orderData.order.currency,
      method: paymentMode === "upi_only" ? { upi: true, netbanking: false, card: false, wallet: false } : undefined,
      handler: (response) => {
        verifyMutation.mutate(response);
      },
      modal: {
        ondismiss: () => {
          setPaymentMessage("Payment window closed. You can reopen it when ready.");
        }
      },
      prefill: {
        name: user?.name || "",
        email: user?.email || ""
      },
      theme: {
        color: "#06b6d4"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      setPaymentMessage(response?.error?.description || "Payment failed. Please try again.");
    });
    rzp.open();
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
      <p className="mt-2 text-slate-700">One login creates one registration profile. Fill details, create order, then complete Razorpay payment.</p>

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
                resetFieldErrors(type === "individual" ? 1 : teammates.length);
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
          onChange={(event) => {
            setTeamName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, teamName: "" }));
          }}
          className={getInputClass(Boolean(fieldErrors.teamName))}
          placeholder="Team Name"
          required
        />
        {fieldErrors.teamName ? <p className="text-sm text-rose-600">{fieldErrors.teamName}</p> : null}

        <input
          value={teamLeaderName}
          onChange={(event) => {
            setTeamLeaderName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, teamLeaderName: "" }));
          }}
          className={getInputClass(Boolean(fieldErrors.teamLeaderName))}
          placeholder="Team Leader Name"
          required
        />
        {fieldErrors.teamLeaderName ? <p className="text-sm text-rose-600">{fieldErrors.teamLeaderName}</p> : null}

        <input
          value={rollNo}
          onChange={(event) => {
            setRollNo(event.target.value);
            setFieldErrors((prev) => ({ ...prev, rollNo: "" }));
          }}
          className={getInputClass(Boolean(fieldErrors.rollNo))}
          placeholder="Roll No"
          required
        />
        {fieldErrors.rollNo ? <p className="text-sm text-rose-600">{fieldErrors.rollNo}</p> : null}

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Gender
          <select
            value={leaderGender}
            onChange={(event) => setLeaderGender(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
            required
          >
            {GENDER_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Year
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
              required
            >
              {YEAR_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Branch
            <select
              value={branch}
              onChange={(event) => onBranchChange(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
              required
            >
              {BRANCH_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Section
            <select
              value={section}
              onChange={(event) => setSection(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
              required
            >
              {leaderSectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Theme
          <select
            value={themeTrack}
            onChange={(event) => setThemeTrack(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
          >
            {tracks.map((track) => (
              <option key={track} value={track}>
                {track}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Payment Method</h2>
          <p className="mt-1 text-xs text-slate-500">UPI is enabled. You can keep UPI-only or allow all methods.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(PAYMENT_MODE_OPTIONS).map(([mode, option]) => {
              const selected = paymentMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`rounded-lg border p-3 text-left transition ${
                    selected ? "border-cyan-600 bg-cyan-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">{option.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{option.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

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
                    className={getInputClass(Boolean(fieldErrors.teammates[index]?.name))}
                    placeholder={`Member ${index + 1} Name`}
                  />
                  {fieldErrors.teammates[index]?.name ? <p className="text-sm text-rose-600">{fieldErrors.teammates[index].name}</p> : null}
                  <label className="grid gap-1 text-sm font-semibold text-slate-700">
                    Gender
                    <select
                      value={item.gender}
                      onChange={(event) => updateTeammate(index, "gender", event.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <input
                    value={item.rollNo}
                    onChange={(event) => updateTeammate(index, "rollNo", event.target.value)}
                    className={getInputClass(Boolean(fieldErrors.teammates[index]?.rollNo))}
                    placeholder="Roll No"
                  />
                  {fieldErrors.teammates[index]?.rollNo ? <p className="text-sm text-rose-600">{fieldErrors.teammates[index].rollNo}</p> : null}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="grid gap-1 text-sm font-semibold text-slate-700">
                      Year
                      <select
                        value={item.year}
                        onChange={(event) => updateTeammate(index, "year", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                      >
                        {YEAR_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-700">
                      Branch
                      <select
                        value={item.branch}
                        onChange={(event) => updateTeammate(index, "branch", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                      >
                        {BRANCH_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-700">
                      Section
                      <select
                        value={item.section}
                        onChange={(event) => updateTeammate(index, "section", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                      >
                        {getSectionOptionsForBranch(item.branch).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
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
          Pay Now via Razorpay (INR {selectedFee})
        </button>
      )}

      {requiresLogin && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Login required</p>
          <p className="mt-1">Your session is missing or expired. Log in again and retry the registration order.</p>
          <div className="mt-2">
            <Link to="/login?redirect=/hackathon-register" className="font-semibold underline">
              Go to Login
            </Link>
          </div>
        </div>
      )}

      {!requiresLogin && paymentAlert && (
        <div
          className={`mt-4 rounded-lg border p-4 text-sm ${
            paymentAlert.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : paymentAlert.tone === "warning"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : paymentAlert.tone === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-slate-200 bg-slate-50 text-slate-800"
          }`}
        >
          <p className="font-semibold">{paymentAlert.title}</p>
          <p className="mt-1">{paymentAlert.hint}</p>
        </div>
      )}

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
