import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Save, Upload, UserCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { GENDER_OPTIONS } from "../utils/constants";

const initialForm = {
  name: "",
  email: "",
  mobile: "",
  gender: GENDER_OPTIONS[0].value,
  profilePicture: ""
};

function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/participant/dashboard");
        const profile = response.data?.profile || {};

        if (!isMounted) {
          return;
        }

        setForm({
          name: profile.name || user?.name || "",
          email: profile.email || user?.email || "",
          mobile: profile.mobile || user?.mobile || "",
          gender: profile.gender || user?.gender || GENDER_OPTIONS[0].value,
          profilePicture: profile.profilePicture || user?.profilePicture || ""
        });
      } catch (err) {
        if (isMounted) {
          setForm({
            name: user?.name || "",
            email: user?.email || "",
            mobile: user?.mobile || "",
            gender: user?.gender || GENDER_OPTIONS[0].value,
            profilePicture: user?.profilePicture || ""
          });
          setError(getErrorMessage(err, "Unable to load profile right now."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.email, user?.mobile, user?.name, user?.profilePicture]);

  const previewName = useMemo(() => form.name || "Participant", [form.name]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Image must be 1MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, profilePicture: reader.result?.toString() || "" }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      gender: user?.gender || GENDER_OPTIONS[0].value,
      profilePicture: user?.profilePicture || ""
    });
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedMobile = form.mobile.trim();

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (trimmedMobile && !/^\d{10}$/.test(trimmedMobile)) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.put("/participant/profile", {
        name: trimmedName,
        email: trimmedEmail,
        mobile: trimmedMobile,
        gender: form.gender,
        profilePicture: form.profilePicture || ""
      });

      const profile = response.data?.profile;

      if (profile) {
        setForm({
          name: profile.name || "",
          email: profile.email || "",
          mobile: profile.mobile || "",
          gender: profile.gender || GENDER_OPTIONS[0].value,
          profilePicture: profile.profilePicture || ""
        });

        updateUser({
          name: profile.name,
          email: profile.email,
          mobile: profile.mobile,
          gender: profile.gender,
          profilePicture: profile.profilePicture
        });
      }

      setIsEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save profile."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card flex min-h-56 items-center justify-center rounded-2xl p-6 text-slate-700">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading profile...
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Participant Profile</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">My Profile</h1>
        <p className="mt-3 text-slate-700">Update your personal details and profile picture used for hackathon communication.</p>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="space-y-3 text-center md:text-left">
            <div className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200 bg-cyan-50 md:mx-0">
              {form.profilePicture ? (
                <img src={form.profilePicture} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <UserCircle2 size={70} className="text-cyan-700" />
              )}
            </div>

            {isEditing ? (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 hover:border-cyan-500">
                <Upload size={14} /> Upload picture
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">Name</span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-cyan-500 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-cyan-500 disabled:bg-slate-100"
                />
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Mobile Number</span>
                <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-100 has-disabled:bg-slate-100">
                  <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700" aria-hidden="true">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="10-digit mobile number"
                    className="w-full border-0 bg-transparent px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:text-slate-500"
                  />
                </div>
              </label>

              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Gender</span>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-cyan-500 disabled:bg-slate-100"
                >
                  {GENDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-600">Preview: <span className="font-semibold text-slate-800">{previewName}</span></p>
            </div>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            {success ? <p className="text-sm font-medium text-emerald-600">{success}</p> : null}

            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300 bg-cyan-50 px-5 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-500 hover:bg-cyan-100"
                >
                  <Pencil size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
