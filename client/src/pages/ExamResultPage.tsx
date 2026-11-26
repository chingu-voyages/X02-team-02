import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { getExamResult } from "../api/exams";
import type { GetExamResultResponse } from "@x02/shared";
import { ApiError } from "../api/client";
import QuestionResultCard from "../components/QuestionResultCard";
import { scorePercent } from "../utils/utils";

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
    <section>
      {status === "loading" && <p role="status">Loading results...</p>}
      {status === "error" && <p role="alert">{message}</p>}
      {status === "ready" && result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 flex gap-6 md:flex-col">
            {/* Score card */}
            <div className="w-50 max-w-[45%] md:w-full md:max-w-full bg-surface border border-line rounded-lg p-6 flex flex-col items-center gap-2">
              <h2
                className="text-fg-muted outline-none"
                ref={headingRef}
                tabIndex={-1}
              >
                Your score
              </h2>
              <span className="text-2xl font-medium text-fg">
                {result.score} / {result.total}
              </span>
              <span className="text-fg-muted">
                {scorePercent(result.score, result.total)}%
              </span>
            </div>

            {/* Attempt details */}
            <div className="self-center md:self-auto">
              <p>Category: {result.category}</p>
              <p>
                Date:{" "}
                {new Date(result.finishedAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
                ,{" "}
                {new Date(result.finishedAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 md:max-h-[calc(100vh-8rem)] md:overflow-y-auto md:pr-2">
            <h3 className="text-lg font-semibold outline-none mb-2">
              Review your answers
            </h3>

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
          </div>
        </div>
      )}
    </section>
  );
}
