import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { RequireAuth } from "./auth/RequireAuth.tsx";
import Layout from "./pages/Layout.tsx";
import AdminQuestionsPage from "./pages/AdminQuestionsPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import NewQuestionPage from "./pages/NewQuestionPage.tsx";
import PracticeExamPage from "./pages/PracticeExamPage.tsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Public demo quiz: no login needed. */}
          <Route path="/practice-exam" element={<PracticeExamPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<Layout />}>
              <Route path="questions" element={<AdminQuestionsPage />} />
              <Route path="questions/new" element={<NewQuestionPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
