import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { getExamResult } from "../api/exams";
import type { GetExamResultResponse } from "@x02/shared";
import { ApiError } from "../api/client";
import QuestionResultCard from "../components/QuestionResultCard";

type Status = "loading" | "error" | "ready";

export default function ExamResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<GetExamResultResponse>();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!attemptId) return;

    async function loadResult(id: string) {
      setStatus("loading");
      setMessage("");

      try {
        const response = await getExamResult(id);
        setResult(response);
        setStatus("ready");
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          navigate(`/exams/${id}/review`, { replace: true });
          return;
        }

        setStatus("error");
        setMessage(
          error instanceof ApiError && error.status === 404
            ? "The results could not be found."
            : "Could not load the results. Please try again.",
        );
      }
    }

    loadResult(attemptId);
  }, [attemptId, navigate]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [status]);

  return (
    <section className="mx-auto max-w-2xl">
      {status === "loading" && <p role="status">Loading results...</p>}
      {status === "error" && <p role="alert">{message}</p>}
      {status === "ready" && result && (
        <>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-semibold outline-none"
          >
            You got {result.score} out of {result.total}
          </h2>
          <ol className="mt-4 space-y-4">
            {result.results.map((q) => (
              <QuestionResultCard
                key={q.id}
                position={q.position}
                text={q.text}
                isCorrect={q.isCorrect}
                yourAnswer={q.yourAnswer}
                correctAnswer={q.correctAnswer}
              />
            ))}
          </ol>
          <div className="mt-8 flex align-center gap-3">
            <Link
              to={`/exams/${encodeURIComponent(result.category)}/start`}
              className="btn-primary text-center"
            >
              Retake the exam
            </Link>
            <Link to="/exams" className="btn-neutral">
              Back to exams
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
