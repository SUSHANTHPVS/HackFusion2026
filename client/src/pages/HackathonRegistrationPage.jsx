import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { WhatsAppAccessCard } from "../components/WhatsAppAccessCard";
import { BankDetailsForm } from "../components/BankDetailsForm";
import { CollegePaymentDetailsCard } from "../components/CollegePaymentDetailsCard";
import { PaymentProofUploadForm } from "../components/PaymentProofUploadForm";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { GENDER_OPTIONS, YEAR_OPTIONS } from "../utils/constants";

const tracks = [
  "Multi-Robot Task Negotiation Engine",
  "Semantic SLAM Recovery & Map Reconstruction",
  "Physics-Informed Drone Digital Twin",
  "Robot Fleet Recovery Under Cascading Failures",
  "Zero-Trust Agent Identity & Privilege Fabric",
  "Software Supply-Chain Attack Graph Engine",
  "Privacy-Preserving Threat Intelligence Network",
  "Multi-Agent AI Reasoning & Verification Engine"
];
const TEAM_REGISTRATION_FEE = 200;

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
    hint: message
  };
}

function createTeamAndOrder(payload) {
  console.group("🚀 MUTATION FUNCTION - createTeamAndOrder");
  console.log("Received payload:", payload);
  console.log("Payload.collegeName:", payload.collegeName);
  console.log("Payload keys:", Object.keys(payload));
  console.groupEnd();
  
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

function createEmptyFieldErrors(teammateCount = 2) {
  return {
    teamName: "",
    collegeName: "",
    teamLeaderName: "",
    rollNo: "",
    teammates: Array.from({ length: teammateCount }, () => ({ name: "", email: "", rollNo: "", mobile: "", ieeeMemberId: "" }))
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
  const navigate = useNavigate();
  const participationType = "team";
  const [teamName, setTeamName] = useState("");
  const [teamLeaderName, setTeamLeaderName] = useState(user?.name || "");
  const [collegeName, setCollegeName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [leaderGender, setLeaderGender] = useState(GENDER_OPTIONS[0].value);
  const [year, setYear] = useState(YEAR_OPTIONS[0]);
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [themeTrack, setThemeTrack] = useState(tracks[0]);
  const [teammates, setTeammates] = useState([
    {
      name: "",
      email: "",
      gender: GENDER_OPTIONS[0].value,
      rollNo: "",
      mobile: "",
      year: YEAR_OPTIONS[0],
      branch: "",
      section: "",
      ieeeMember: false,
      ieeeMemberId: ""
    },
    {
      name: "",
      email: "",
      gender: GENDER_OPTIONS[0].value,
      rollNo: "",
      mobile: "",
      year: YEAR_OPTIONS[0],
      branch: "",
      section: "",
      ieeeMember: false,
      ieeeMemberId: ""
    }
  ]);
  const [orderData, setOrderData] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(() => createEmptyFieldErrors(2));
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [successfulTeam, setSuccessfulTeam] = useState(null);
  const [formData, setFormData] = useState({
    bankDetails: {
      accountHolder: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      accountType: "savings"
    }
  });
  const [bankDetailsErrors, setBankDetailsErrors] = useState("");
  const [existingTeam, setExistingTeam] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

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
      setPaymentVerified(true);
      setSuccessfulTeam({
        name: teamName.trim(),
        participationType,
        teammates
      });
      navigate("/participant/my-team", { replace: true });
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
      setPaymentVerified(data.paymentStatus === "success");
      setSuccessfulTeam(data.team || null);

      if (data.paymentStatus === "success") {
        setPaymentMessage("Registration already completed for your account.");
        navigate("/participant/my-team", { replace: true });
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
      
      console.error("❌ Registration Error:", {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        message: serverMessage,
        fullResponse: error?.response?.data,
        allErrorData: error
      });
      
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

  // Load existing team and payment data on mount
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setIsLoadingExisting(true);
        const response = await api.get("/participant/dashboard");
        
        if (response.data?.team) {
          setExistingTeam(response.data.team);
          
          const latestPayment = response.data.payment;
          setExistingPayment(latestPayment);
          
          // If payment was rejected, show message
          if (latestPayment?.status === "failed") {
            setPaymentMessage(`Your payment was rejected: ${latestPayment.rejectionReason || "Payment proof did not meet verification criteria"}. Please upload a new payment proof below.`);
            // Also populate bank details form if it's the same team
            if (latestPayment.bankDetails) {
              setFormData((prev) => ({
                ...prev,
                bankDetails: latestPayment.bankDetails
              }));
            }
          }
        }
      } catch (error) {
        // Silently fail - user doesn't have team yet
        console.log("No existing team found");
      } finally {
        setIsLoadingExisting(false);
      }
    };

    if (isAuthenticated) {
      loadExistingData();
    }
  }, [isAuthenticated]);

  const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || orderData?.keyId || "";
  const canPay = useMemo(
    () => Boolean(orderData?.order && razorpayKeyId && orderData?.paymentStatus === "created"),
    [orderData, razorpayKeyId]
  );
  const paymentAlert = useMemo(() => getPaymentAlert(paymentMessage), [paymentMessage]);
  const selectedFee = TEAM_REGISTRATION_FEE;
  const totalMembers = 1 + teammates.length;

  const resetFieldErrors = (teammateCount = teammates.length) => {
    setFieldErrors(createEmptyFieldErrors(teammateCount));
  };

  const updateTeammate = (index, field, value) => {
    if (field === "name" || field === "email" || field === "rollNo" || field === "mobile" || field === "ieeeMemberId") {
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

        if (field === "ieeeMember" && !value) {
          return { ...item, ieeeMember: false, ieeeMemberId: "" };
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
          email: "",
          gender: GENDER_OPTIONS[0].value,
          rollNo: "",
          mobile: "",
          year: YEAR_OPTIONS[0],
          branch: "",
          section: "",
          ieeeMember: false,
          ieeeMemberId: ""
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
    setPaymentVerified(false);
    setSuccessfulTeam(null);
    resetFieldErrors(teammates.length);

    console.log("🔍 Form state at submission:", {
      teamName,
      teamLeaderName,
      collegeName,
      rollNo,
      year,
      branch,
      section,
      themeTrack,
      leaderGender,
      teamsLength: teammates.length,
      formDataBankDetails: formData.bankDetails
    });

    const normalizedTeammates = teammates.map((item) => ({
      name: item.name.trim(),
      email: item.email.trim().toLowerCase(),
      gender: item.gender,
      rollNo: item.rollNo.trim().toUpperCase(),
      mobile: item.mobile.trim(),
      year: item.year.trim(),
      branch: item.branch.trim(),
      section: item.section.trim(),
      ieeeMember: Boolean(item.ieeeMember),
      ieeeMemberId: item.ieeeMember ? item.ieeeMemberId.trim() : ""
    }));

    const filledTeammates = normalizedTeammates.filter(
      (item) => item.name && item.email && item.rollNo && item.mobile && item.year && item.branch && item.section
    );

    if (!teamName.trim() || !teamLeaderName.trim() || !collegeName.trim() || !rollNo.trim() || !year.trim() || !branch.trim() || !section.trim() || !themeTrack.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        teamName: !teamName.trim() ? "Team name is required." : prev.teamName,
        teamLeaderName: !teamLeaderName.trim() ? "Team leader name is required." : prev.teamLeaderName,
        collegeName: !collegeName.trim() ? "College name is required." : prev.collegeName,
        rollNo: !rollNo.trim() ? "Leader roll number is required." : prev.rollNo
      }));
      setPaymentMessage("All required fields (team name, college name, leader details, branch, section, and theme track) must be filled before payment.");
      return;
    }

    if (filledTeammates.length !== teammates.length) {
      setPaymentMessage("Each teammate row must include name, email, mobile, roll no, year, branch, and section, or remove the row.");
      return;
    }

    if (filledTeammates.length < 2 || filledTeammates.length > 3) {
      setPaymentMessage("Team registration requires 2 to 3 teammates (3 to 4 total members including leader).");
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

    const invalidMobileIndex = filledTeammates.findIndex((item) => !/^\d{10}$/.test(item.mobile));
    if (invalidMobileIndex >= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        teammates: prev.teammates.map((item, idx) =>
          idx === invalidMobileIndex ? { ...item, mobile: "Mobile number must be exactly 10 digits." } : item
        )
      }));
      setPaymentMessage("Each teammate mobile number must contain exactly 10 digits.");
      return;
    }

    const invalidEmailIndex = filledTeammates.findIndex((item) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email));
    if (invalidEmailIndex >= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        teammates: prev.teammates.map((item, idx) =>
          idx === invalidEmailIndex ? { ...item, email: "Enter a valid email address." } : item
        )
      }));
      setPaymentMessage("Each teammate must have a valid email address.");
      return;
    }

    if (new Set(filledTeammates.map((item) => item.mobile)).size !== filledTeammates.length) {
      setPaymentMessage("Duplicate teammate mobile numbers are not allowed.");
      return;
    }

    const invalidIeeeIndex = filledTeammates.findIndex(
      (item) => item.ieeeMember && !/^\d{7,9}$/.test(item.ieeeMemberId)
    );
    if (invalidIeeeIndex >= 0) {
      setFieldErrors((prev) => ({
        ...prev,
        teammates: prev.teammates.map((item, idx) =>
          idx === invalidIeeeIndex ? { ...item, ieeeMemberId: "Enter a valid IEEE Member ID (7-9 digits)." } : item
        )
      }));
      setPaymentMessage("Enter a valid IEEE Member ID for each teammate marked as an IEEE member.");
      return;
    }

    const payload = {
      participationType,
      teamName: teamName.trim(),
      teamLeaderName: teamLeaderName.trim(),
      collegeName: collegeName.trim() || "",
      leaderGender,
      rollNo: rollNo.trim(),
      year: year.trim(),
      branch: branch.trim(),
      section: section.trim(),
      themeTrack,
      teammates: filledTeammates,
      bankDetails: formData.bankDetails
    };
    
    // Detailed debugging for collegeName
    console.group("🔍 COLLEGE NAME DEBUGGING");
    console.log("Raw collegeName state:", collegeName);
    console.log("After trim():", collegeName.trim());
    console.log("collegeName in payload:", payload.collegeName);
    console.log("Full payload keys:", Object.keys(payload));
    console.log("Full payload:", payload);
    console.groupEnd();
    
    console.log("📤 Sending registration payload:", payload);
    console.log("📝 College Name in payload:", payload.collegeName, "- Length:", payload.collegeName.length);
    
    createOrderMutation.mutate(payload);
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
      <p className="mt-2 text-slate-700">One login creates one registration profile. Fill details, create order, then complete payment.</p>

      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1.5 text-sm font-semibold text-cyan-900 shadow-sm">
        <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Eligible Years</span>
        <span>2nd / 3rd / 4th year</span>
      </div>

      <div className="mt-5 rounded-xl border border-cyan-200 bg-cyan-50 p-4">
        <p className="text-sm font-bold uppercase tracking-wide text-cyan-800">Team Registration Only</p>
        <p className="mt-1 text-xs text-cyan-700">Minimum 3 members and maximum 4 members (including leader).</p>
        <p className="mt-2 text-2xl font-extrabold text-slate-900">INR {selectedFee}</p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={onCreateOrder}>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          College Name
          <input
            type="text"
            name="collegeName"
            value={collegeName}
            onChange={(event) => {
              console.log("🔄 College Name onChange triggered:", event.target.value);
              setCollegeName(event.target.value);
            }}
            className={getInputClass(Boolean(fieldErrors.collegeName))}
            placeholder="Name of Your College"
            required
          />
        </label>
        {fieldErrors.collegeName ? <p className="text-sm text-rose-600">{fieldErrors.collegeName}</p> : null}

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

        <input
          value={user?.email || ""}
          className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-700"
          placeholder="Team Leader Email"
          aria-label="Team Leader Email"
          readOnly
        />

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
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
              placeholder="e.g., CSE, ECE, ME"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Section
            <input
              value={section}
              onChange={(event) => setSection(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
              placeholder="e.g., A, B, C"
              required
            />
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

            <p className="mb-3 text-xs text-slate-500">Add 2 to 3 teammates with full details. Team size must be 3 to 4 including leader.</p>

            <div className="grid gap-3">
              {teammates.map((item, index) => (
                <div key={index} className="grid gap-2 rounded-md border border-slate-100 p-3">
                  <input
                    value={item.name}
                    onChange={(event) => updateTeammate(index, "name", event.target.value)}
                    className={getInputClass(Boolean(fieldErrors.teammates[index]?.name))}
                    placeholder={`Member ${index + 1} Name`}
                    required
                  />
                  {fieldErrors.teammates[index]?.name ? <p className="text-sm text-rose-600">{fieldErrors.teammates[index].name}</p> : null}
                  <input
                    type="email"
                    value={item.email}
                    onChange={(event) => updateTeammate(index, "email", event.target.value)}
                    className={getInputClass(Boolean(fieldErrors.teammates[index]?.email))}
                    placeholder={`Member ${index + 1} Email`}
                    autoComplete="email"
                    required
                  />
                  {fieldErrors.teammates[index]?.email ? <p className="text-sm text-rose-600">{fieldErrors.teammates[index].email}</p> : null}
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
                    required
                  />
                  {fieldErrors.teammates[index]?.rollNo ? <p className="text-sm text-rose-600">{fieldErrors.teammates[index].rollNo}</p> : null}
                  <input
                    value={item.mobile}
                    onChange={(event) => updateTeammate(index, "mobile", event.target.value.replace(/\D/g, ""))}
                    className={getInputClass(Boolean(fieldErrors.teammates[index]?.mobile))}
                    placeholder="Mobile Number"
                    inputMode="numeric"
                    maxLength={10}
                    required
                  />
                  {fieldErrors.teammates[index]?.mobile ? <p className="text-sm text-rose-600">{fieldErrors.teammates[index].mobile}</p> : null}
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="grid gap-1 text-sm font-semibold text-slate-700">
                      Year
                      <select
                        value={item.year}
                        onChange={(event) => updateTeammate(index, "year", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                        required
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
                      <input
                        value={item.branch}
                        onChange={(event) => updateTeammate(index, "branch", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                        placeholder="e.g., CSE, ECE, ME"
                        required
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-700">
                      Section
                      <input
                        value={item.section}
                        onChange={(event) => updateTeammate(index, "section", event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-normal text-slate-900"
                        placeholder="e.g., A, B, C"
                        required
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(item.ieeeMember)}
                      onChange={(event) => updateTeammate(index, "ieeeMember", event.target.checked)}
                    />
                    I am an IEEE member
                  </label>
                  {item.ieeeMember ? (
                    <>
                      <input
                        value={item.ieeeMemberId}
                        onChange={(event) => updateTeammate(index, "ieeeMemberId", event.target.value.replace(/\D/g, ""))}
                        className={getInputClass(Boolean(fieldErrors.teammates[index]?.ieeeMemberId))}
                        placeholder="Enter Your IEEE Member ID"
                        inputMode="numeric"
                        maxLength={9}
                      />
                      {fieldErrors.teammates[index]?.ieeeMemberId ? (
                        <p className="text-sm text-rose-600">{fieldErrors.teammates[index].ieeeMemberId}</p>
                      ) : null}
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeTeammate(index)}
                    disabled={teammates.length === 2}
                    className="justify-self-start rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-slate-600">Current team size: {totalMembers}/4</p>
          </div>

        <BankDetailsForm 
          formData={formData} 
          onChange={setFormData}
          errors={{ bankDetails: bankDetailsErrors }}
        />

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

      {orderData?.bankDetails && (
        <>
          <CollegePaymentDetailsCard bankDetails={orderData.bankDetails} />
          {successfulTeam && (
            <PaymentProofUploadForm
              teamId={successfulTeam._id}
              paymentAmount={selectedFee}
              onSuccess={() => {
                setPaymentMessage("Payment proof submitted successfully! Waiting for admin verification...");
              }}
              onError={(error) => {
                setPaymentMessage(error?.response?.data?.message || "Failed to upload payment proof");
              }}
            />
          )}
        </>
      )}

      {/* Show upload form for rejected payments (resubmission) */}
      {existingPayment?.status === "failed" && existingTeam && (
        <>
          {orderData?.bankDetails ? null : (
            <CollegePaymentDetailsCard bankDetails={existingPayment.bankDetails || orderData?.bankDetails} />
          )}
          <div className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-800">⚠️ Resubmit Payment Proof</p>
            <p className="mt-2 text-sm text-amber-700">
              Your previous payment proof was rejected. Please review the reason above and submit a corrected proof.
            </p>
          </div>
          <PaymentProofUploadForm
            teamId={existingTeam._id}
            paymentAmount={existingPayment.amount || selectedFee}
            isResubmission={true}
            onSuccess={() => {
              setPaymentMessage("Payment proof resubmitted successfully! Waiting for admin verification...");
              setExistingPayment((prev) => ({ ...prev, status: "pending_verification" }));
            }}
            onError={(error) => {
              setPaymentMessage(error?.response?.data?.message || "Failed to upload payment proof");
            }}
          />
        </>
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

      {paymentVerified ? (
        <WhatsAppAccessCard
          payment={{ status: "success", participationType, amount: selectedFee }}
          team={successfulTeam || {
            name: teamName.trim(),
            participationType,
            teammates
          }}
        />
      ) : null}

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
