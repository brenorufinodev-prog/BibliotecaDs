import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { AcervoPage } from "./pages/AcervoPage";
import { EmprestimosPage } from "./pages/EmprestimosPage";
import { SolicitacoesPage } from "./pages/SolicitacoesPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/acervo"
            element={
              <ProtectedRoute>
                <AcervoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emprestimos"
            element={
              <ProtectedRoute>
                <EmprestimosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/solicitacoes"
            element={
              <ProtectedRoute>
                <SolicitacoesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{ duration: 3500 }}
        />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}