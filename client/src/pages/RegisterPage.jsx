import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useCallback } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  department: z.string().min(2),
  ieeeMember: z.boolean().optional()
});

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { ieeeMember: false }
  });

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      navigate("/login");
    }
  });

  const googleMutation = useMutation({
    mutationFn: authService.googleAuth,
    onSuccess: (data) => {
      login(data);
      navigate("/");
    }
  });

  const { mutate: googleRegister, isPending: isGooglePending, isError: isGoogleError } = googleMutation;

  const onGoogleToken = useCallback(
    (idToken) => {
      googleRegister({ idToken });
    },
    [googleRegister]
  );

  return (
    <section className="glass-card mx-auto max-w-2xl rounded-2xl p-6">
      <h1 className="text-3xl font-bold">Register Participant</h1>
      <div className="mt-4 grid place-items-center">
        <GoogleAuthButton text="signup_with" onToken={onGoogleToken} disabled={isGooglePending} />
      </div>
      {isGoogleError && <p className="mt-2 text-sm text-rose-600 text-center">Google registration failed. Try again.</p>}
      <p className="mt-4 text-center text-xs uppercase tracking-wide text-slate-500">or register with form</p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
        <input {...register("name")} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Full name" />
        {errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}
        <input {...register("email")} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Email" />
        {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11"
            placeholder="Password"
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
        {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
        <input {...register("department")} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Department" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("ieeeMember")} /> I am an IEEE member
        </label>
        <button disabled={mutation.isPending} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
          {mutation.isPending ? "Submitting..." : "Create Account"}
        </button>
        {mutation.isError && <p className="text-sm text-rose-600">Registration failed. Try again.</p>}
        {mutation.isSuccess && <p className="text-sm text-emerald-600">Registration successful. You can now login.</p>}
      </form>
    </section>
  );
}
