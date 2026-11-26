import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { ApiError } from "../api/client.ts";
import { getInProgressExam, startExam } from "../api/exams.ts";

export default function ExamIntroPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [inProgressAttemptId, setInProgressAttemptId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!category) return;

    async function loadInProgressExam(category: string) {
      try {
        const response = await getInProgressExam(category);
        setInProgressAttemptId(response.attemptId);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    loadInProgressExam(category);
  }, [category]);

  if (!category) {
    return <p role="alert">No category selected.</p>;
  }

  async function onBegin() {
    if (!category) return;

    setIsStarting(true);
    setMessage("");

    try {
      const response = await startExam(category);
      navigate(`/exams/${response.attemptId}/questions/1`);
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 404
          ? `There are no questions for ${category} yet.`
          : "Could not start the exam. Please try again.",
      );
      setIsStarting(false);
    }
  }

  const startBtn = inProgressAttemptId ? "Resume exam" : "Begin exam";

  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-xl font-semibold">{category} practice test</h2>

      <ul className="mt-4 list-disc space-y-1 pl-5">
        <li>Random questions, different every attempt</li>
        <li>The exam is not time limited</li>
        <li>You can go back to questions you are unsure about</li>
        <li>At the end you get your score and the correct solutions</li>
      </ul>

      {inProgressAttemptId && (
        <p className="mt-4">
          You have an exam in progress. Resume to continue where you left off.
        </p>
      )}

      {message && (
        <p role="alert" className="mt-4">
          {message}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() => onBegin()}
          disabled={isStarting || isLoading}
        >
          {isStarting ? "Starting..." : isLoading ? "Loading..." : startBtn}
        </button>

        <Link to="/exams" className="btn-secondary">
          Back to exams
        </Link>
      </div>
    </section>
  );
}
