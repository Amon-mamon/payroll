import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarClock, Loader2, ReceiptText, Wallet } from "lucide-react";
import { FormField } from "@/components/custom/formfield";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import icon from "@/constant/icon";
import { getErrorMessage } from "@/lib/errors";
import { loginSchema, type LoginCredentials } from "../schema/loginSchema";
import { useLogin } from "../hooks/useLogin";

const highlights = [
  { icon: CalendarClock, text: "Clock in and out from anywhere" },
  { icon: ReceiptText, text: "File leave requests in seconds" },
  { icon: Wallet, text: "See every payslip, line by line" },
];

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const {
    handleSubmit,
    register,
    setError,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const { mutate: login, isPending } = useLogin();

  const onSubmit = (data: LoginCredentials) => {
    login(data, {
      onSuccess: () => navigate(from, { replace: true }),
      onError: (error) =>
        setError("root", {
          type: "server",
          message:
            (error as { response?: { status?: number } }).response?.status === 401
              ? "Incorrect email or password."
              : getErrorMessage(error),
        }),
    });
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="auth-hero hidden flex-col justify-between p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="brand-mark">F</span> Flowify Payroll
        </Link>
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl leading-tight font-bold">Time, leave and pay in one place.</h1>
          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm opacity-90">
                <Icon className="size-4" /> {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-70">© {new Date().getFullYear()} Flowify</p>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5">
            <Link to="/" className="flex items-center gap-2 font-semibold lg:hidden">
              <span className="brand-mark">F</span> Flowify Payroll
            </Link>
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">Use the email your HR team registered for you.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              {...register("username")}
              label="Email or username"
              icon={icon.email}
              placeholder="you@company.com"
              autoComplete="username"
              error={errors.username?.message}
            />
            <FormField
              {...register("password")}
              label="Password"
              type="password"
              icon={icon.password}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
            />
            {errors.root && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>
              New company? <Link to="/signup" className="font-medium text-primary hover:underline">Start a free trial</Link>
            </p>
            <p className="text-xs">Forgot your password? Ask your HR or administrator to reset it.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginForm;
