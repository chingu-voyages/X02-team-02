import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { RequireAuth } from "./auth/RequireAuth.tsx";
import { RequireRole } from "./auth/RequireRole.tsx";
import Layout from "./pages/Layout.tsx";
import QuestionsPage from "./pages/QuestionsPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import NewQuestionPage from "./pages/NewQuestionPage.tsx";
import PracticeExamPage from "./pages/PracticeExamPage.tsx";
import ExamCategoriesPage from "./pages/ExamCategoriesPage.tsx";
import ExamIntroPage from "./pages/ExamIntroPage.tsx";
import ExamPage from "./pages/ExamPage.tsx";
import ExamRedirect from "./components/ExamRedirect.tsx";
import ExamReviewPage from "./pages/ExamReviewPage.tsx";
import ExamResultPage from "./pages/ExamResultPage.tsx";
import JournalPage from "./pages/JournalPage.tsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Public demo quiz: no login needed. */}
          <Route path="/practice-exam" element={<PracticeExamPage />} />

          <Route element={<RequireAuth />}>
            {/* All admin routes require authentication and ADMIN role. */}
            <Route element={<RequireRole allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<Layout />}>
                // TODO: here goes question editing page - only accessible to
                admins
              </Route>
            </Route>

            {/* Learner and Learner/Admin routes */}
            <Route element={<Layout />}>
              <Route path="/exams" element={<ExamCategoriesPage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/questions/new" element={<NewQuestionPage />} />
              <Route
                path="/exams/:category/start"
                element={<ExamIntroPage />}
              />
              <Route
                path="/exams/:attemptId/questions/:position"
                element={<ExamPage />}
              />
              <Route
                path="/exams/:attemptId/review"
                element={<ExamReviewPage />}
              />
              <Route
                path="/exams/:attemptId/result"
                element={<ExamResultPage />}
              />
              <Route path="/exams/:attemptId" element={<ExamRedirect />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
