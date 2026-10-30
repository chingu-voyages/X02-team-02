import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getQuestions } from "../api/questions";

// TODO: export from shared instead when BE is ready
export type QuestionStatus =
  "draft" | "pending" | "approved" | "rejected" | "flagged";

// TODO: export from shared instead when BE is ready
export type QuestionType = "multiple_choice" | "short_answer";

// TODO: export from shared instead when BE is ready
export interface Question {
  id: string;
  text: string;
  category: string; // "PSM", "PSPO", ...
  type: QuestionType;
  status: QuestionStatus;
  submittedBy: string; // username
  createdAt: string; // ISO date string
}

type StatusFilter = QuestionStatus | "all";

const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: "Pending", value: "pending" },
  { label: "Flagged", value: "flagged" },
  { label: "Approved", value: "approved" },
  { label: "All", value: "all" },
];

export default function AdminQuestionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getQuestions()
      .then((data) => {
        if (!ignore) setQuestions(data);
      })
      .catch(() => {
        if (!ignore) setError("Couldn't load questions.");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filteredQuestions =
    statusFilter === "all"
      ? questions
      : questions.filter((q) => q.status === statusFilter);

  return (
    <section>
      <h2>Questions</h2>
      <div className="flex justify-between items-center">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap gap-3"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
              className="border"
            >
              {option.label}
            </button>
          ))}
        </div>

        <Link to="#">+ New Question</Link>
      </div>

      <div>
        {isLoading && <p>Loading questions...</p>}
        {error && <p role="alert">{error}</p>}
        {!isLoading && !error && filteredQuestions.length === 0 && (
          <p>No questions to show</p>
        )}
        {/* {display questions rows} */}
      </div>
    </section>
  );
}
