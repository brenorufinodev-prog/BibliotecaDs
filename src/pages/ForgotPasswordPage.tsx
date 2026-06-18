import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { AuthShell } from "./LoginPage";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const schema = z.object({ email: z.string().email("E-mail inválido") });
type Values = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { requestReset } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (v: Values) => {
    setSubmitting(true);
    try {
      await requestReset(v.email);
      setSent(true);
      toast.success("Se o e-mail existir, enviaremos as instruções.");
    } catch {
      toast.error("Erro ao enviar e-mail");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Recuperar senha" subtitle="Vamos te ajudar a entrar novamente">
      {sent ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          <p className="font-medium">E-mail de recuperação enviado!</p>
          <p className="mt-1 text-emerald-700">
            Verifique sua caixa de entrada e siga as instruções para definir uma nova senha.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center gap-1.5 text-emerald-700 font-medium hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar para login
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="E-mail cadastrado"
              type="email"
              placeholder="voce@email.com"
              error={!!errors.email}
              {...register("email")}
              autoComplete="email"
            />
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Enviar instruções"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-indigo-600 hover:underline">
              <Mail className="h-4 w-4" /> Voltar para login
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}