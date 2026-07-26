import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { GoogleAuthButton } from "../components/GoogleAuthButton";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const redirectPath = new URLSearchParams(location.search).get("redirect");

  const handleLoginSuccess = useCallback(
    (data) => {
      login(data);
      if (redirectPath && redirectPath.startsWith("/")) {
        navigate(redirectPath);
        return;
      }

      const role = data.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "judge") navigate("/judge");
      else navigate("/participant");
    },
    [login, navigate, redirectPath]
  );

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => handleLoginSuccess(data)
  });

  const googleMutation = useMutation({
    mutationFn: authService.googleAuth,
    onSuccess: (data) => handleLoginSuccess(data)
  });

  const { mutate: googleLogin, isPending: isGooglePending, isError: isGoogleError } = googleMutation;

  const onGoogleToken = useCallback(
    (idToken) => {
      googleLogin({ idToken });
    },
    [googleLogin]
  );

  return (
    <section className="glass-card mx-auto max-w-xl rounded-2xl p-6">
      <h1 className="text-3xl font-bold">Login</h1>
      <div className="mt-4 grid place-items-center">
        <GoogleAuthButton text="continue_with" onToken={onGoogleToken} disabled={isGooglePending} />
      </div>
      {isGoogleError && <p className="mt-2 text-sm text-rose-600 text-center">Google login failed. Try again.</p>}
      <p className="mt-4 text-center text-xs uppercase tracking-wide text-slate-500">or use email and password</p>
      <form className="mt-6 grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <input {...register("email")} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Email" />
        {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
        <input {...register("password")} type="password" className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Password" />
        {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
        <button disabled={mutation.isPending} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
          {mutation.isPending ? "Authenticating..." : "Login"}
        </button>
        {mutation.isError && (
          <p className="text-sm text-rose-600">{mutation.error?.response?.data?.message || "Invalid credentials."}</p>
        )}
      </form>
      <p className="mt-5 text-center text-sm text-slate-600">
        Admin access? <Link to="/admin/login" className="font-semibold text-cyan-700">Use admin login</Link>
      </p>
    </section>
  );
}
