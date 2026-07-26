import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

const schema = z.object({
  adminId: z.string().email(),
  password: z.string().min(8)
});

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: authService.adminLogin,
    onSuccess: (data) => {
      login(data);
      navigate("/admin");
    }
  });

  return (
    <section className="glass-card mx-auto max-w-xl rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Restricted Access</p>
      <h1 className="mt-2 text-3xl font-bold">Admin Login</h1>
      <p className="mt-2 text-sm text-slate-600">
        Use the official admin credentials configured on the server to access registration management and attendance controls.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div>
          <input
            {...register("adminId")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Admin email"
          />
          {errors.adminId ? <p className="mt-1 text-sm text-rose-600">{errors.adminId.message}</p> : null}
        </div>

        <div>
          <input
            {...register("password")}
            type="password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Admin password"
          />
          {errors.password ? <p className="mt-1 text-sm text-rose-600">{errors.password.message}</p> : null}
        </div>

        <button disabled={mutation.isPending} className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
          {mutation.isPending ? "Authenticating..." : "Login as Admin"}
        </button>

        {mutation.isError ? (
          <p className="text-sm text-rose-600">{mutation.error?.response?.data?.message || "Admin login failed."}</p>
        ) : null}
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Participant? <Link to="/login" className="font-semibold text-cyan-700">Go to regular login</Link>
      </p>
    </section>
  );
}
