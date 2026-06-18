import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(4, "Senha muito curta"),
});
type Values = z.infer<typeof schema>;

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: Values) => {
    setSubmitting(true);
    try {
      await signIn(v.email, v.password);
      toast.success("Bem-vindo(a) de volta!");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao entrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua biblioteca digital">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          error={!!errors.email}
          {...register("email")}
          autoComplete="email"
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          error={!!errors.password}
          {...register("password")}
          autoComplete="current-password"
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</> : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Não tem conta?{" "}
        <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 relative">
      <div className="absolute right-4 top-4 z-10 rounded-xl bg-white/80 backdrop-blur dark:bg-slate-900/80">
        <ThemeToggle />
      </div>
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white">
        <div className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <BookOpen className="h-5 w-5" />
          </span>
          Biblioteca<span className="text-white/70">.</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Sua biblioteca, organizada e acessível.
          </h1>
          <p className="mt-4 text-white/85">
            Gerencie acervo, controle empréstimos, renovações e acompanhe prazos — tudo em um só lugar,
            com a experiência de uma biblioteca online moderna.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> Autenticação segura e sessão persistente</li>
            <li className="flex items-center gap-2"><Lock className="h-4 w-4" /> Dados isolados por usuário (RLS)</li>
            <li className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Acervo com metadados ricos e capas</li>
          </ul>
        </div>
        <p className="text-xs text-white/60">© {new Date().getFullYear()} Biblioteca Online</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            Biblioteca<span className="text-indigo-600">.</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}