import { useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../api/client.ts";
import { startExam } from "../api/exams.ts";

export default function ExamIntroPage() {
  const { category } = useParams<{ category: string }>();
  //   const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState("");

  if (!category) {
    return <p role="alert">No category selected.</p>;
  }

  async function onBegin() {
    if (!category) return;

    setIsStarting(true);
    setMessage("");

    try {
      const response = await startExam(category);
      // exam screen doesn't exist yet, console log for now
      console.log(response);
      // LATER: navigate(`/exams/${response.attemptId}`);
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 404
          ? `There are no questions for ${category} yet.`
          : "Could not start the exam. Please try again.",
      );
      setIsStarting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <h2 className="text-xl font-semibold">{category} practice test</h2>

      <ul className="mt-4 list-disc space-y-1 pl-5">
        <li>Random questions, different every attempt</li>
        <li>The exam is not time limited</li>
        <li>You can go back to questions you are unsure about</li>
        <li>At the end you get your score and the correct solutions</li>
      </ul>

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
          disabled={isStarting}
        >
          {isStarting ? "Starting..." : "Begin exam"}
        </button>
        <Link to="/exams/categories" className="btn-secondary">
          Back to exams
        </Link>
      </div>
    </section>
  );
}
