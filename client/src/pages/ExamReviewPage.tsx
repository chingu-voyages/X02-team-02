import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import type { GetExamResponse, ExamQuestion } from "@x02/shared";
import { getExam, submitExam } from "../api/exams";
import { ApiError } from "../api/client";

type Status = "loading" | "error" | "ready";

function isAnswered(question: ExamQuestion): boolean {
  return (
    (question.answer?.optionIds?.length ?? 0) > 0 ||
    (question.answer?.text?.trim() ?? "") !== ""
  );
}

export default function ExamReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<GetExamResponse>();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!attemptId) return;

    async function loadAttempt(id: string) {
      setMessage("");
      setStatus("loading");

      try {
        const response = await getExam(id);
        setAttempt(response);
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof ApiError && error.status === 404
            ? "The exam could not be found."
            : "Could not load the exam. Please try again.",
        );
      }
    }

    loadAttempt(attemptId);
  }, [attemptId]);

  const answeredCount =
    attempt?.questions.filter((q) => isAnswered(q)).length ?? 0;
  const unanswered = attempt?.questions.filter((q) => !isAnswered(q)) ?? [];
  const backToQuestion = unanswered.length
    ? unanswered[0].position
    : (attempt?.questions.length ?? 1);

  async function onSubmitExam() {
    if (!attemptId) return;

    setMessage("");
    setIsSubmitting(true);

    try {
      await submitExam(attemptId);
      navigate(`/exams/${attemptId}/result`);
    } catch (error) {
      setIsSubmitting(false);
      setMessage(
        error instanceof ApiError && error.status === 404
          ? "The exam could not be found."
          : "Could not submit the exam. Please try again.",
      );
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-center">Review your answers</h2>
      {status === "loading" && <p role="status">Loading review...</p>}
      {status === "error" && <p role="alert">{message}</p>}
      {status === "ready" && attempt && (
        <>
          <p className="mt-2 text-fg-muted text-center">
            {answeredCount} out of {attempt.questions.length} answered
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-3">
            {attempt.questions.map((q) => (
              <li key={q.id}>
                <Link
                  to={`/exams/${attemptId}/questions/${q.position}`}
                  className={`flex h-12 w-12 items-center justify-center rounded border ${
                    isAnswered(q)
                      ? "border-line bg-page"
                      : "border-warning-line bg-warning-soft"
                  }`}
                >
                  {q.position}{" "}
                  <span className="sr-only">
                    {isAnswered(q) ? "answered" : "unanswered"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {unanswered.length > 0 && (
            <p className="mt-6 text-center">
              {unanswered.length}{" "}
              {unanswered.length === 1 ? "question is" : "questions are"}{" "}
              unanswered. You can still submit.
            </p>
          )}
          {message && (
            <p role="alert" className="mt-6 text-center">
              {message}
            </p>
          )}
          <div className="mt-8 flex gap-3 justify-center">
            <button
              type="button"
              className="btn-primary"
              disabled={isSubmitting}
              onClick={onSubmitExam}
            >
              {isSubmitting ? "Submitting..." : "Submit exam"}
            </button>
            <button
              type="button"
              className="btn-neutral"
              disabled={isSubmitting}
              onClick={() =>
                navigate(`/exams/${attemptId}/questions/${backToQuestion}`)
              }
            >
              Back to question {backToQuestion}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
