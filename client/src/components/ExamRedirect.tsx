import { useParams, Navigate } from "react-router";

export default function ExamRedirect() {
  const { attemptId } = useParams<{ attemptId: string }>();

  return <Navigate to={`/exams/${attemptId}/questions/1`} replace />;
}
