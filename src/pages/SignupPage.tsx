import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AuthShell } from "./LoginPage";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import type { AppUser } from "../types";

const schema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
  })
  .refine((d) => d.password.length >= 6, { message: "Mínimo 6 caracteres", path: ["password"] });

type Values = z.infer<typeof schema>;

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });

  const onSubmit = async (v: Values) => {
    setSubmitting(true);
    try {
      const u: AppUser = await signUp(v.email, v.password, "usuario");
      toast.success(`Conta criada! Bem-vindo(a), ${u.email}`);
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cadastrar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Criar conta" subtitle="Comece a organizar sua biblioteca hoje">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Nome"
          placeholder="Como podemos te chamar?"
          error={!!errors.name}
          {...register("name")}
        />
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
          placeholder="Mínimo 6 caracteres"
          error={!!errors.password}
          {...register("password")}
          autoComplete="new-password"
        />
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando conta...</> : "Criar conta"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Já tem conta?{" "}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Entrar
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <BookOpen className="h-3 w-3" /> Seus dados ficam isolados pelo seu user_id (RLS)
      </p>
    </AuthShell>
  );
}