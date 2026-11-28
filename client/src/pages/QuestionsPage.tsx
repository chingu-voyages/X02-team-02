import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getQuestions } from "../api/questions.ts";
import type { LoadedQuestion, QuestionReviewStatus } from "@x02/shared";
import { useAuth } from "../auth/useAuth.ts";

type StatusFilter = QuestionReviewStatus | "ALL";

const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Flagged", value: "FLAGGED" },
  { label: "All", value: "ALL" },
];

const statusLabels: Record<QuestionReviewStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FLAGGED: "Flagged",
};

const statusStyles: Record<QuestionReviewStatus, string> = {
  DRAFT: "bg-surface border-line text-fg-muted",
  PENDING: "bg-warning-soft border-warning-line text-warning-fg",
  APPROVED: "bg-success-soft border-success-line text-success-fg",
  REJECTED: "bg-danger-soft border-danger-line text-danger-fg",
  FLAGGED: "bg-danger-soft border-danger-line text-danger-fg",
};

// TODO: pagination

export default function QuestionsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    isAdmin ? "PENDING" : "ALL",
  );
  const [questions, setQuestions] = useState<LoadedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    getQuestions()
      .then((data) => {
        if (!ignore) setQuestions(data.questions);
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
    statusFilter === "ALL"
      ? questions
      : questions.filter((q) => q.reviewStatus === statusFilter);

  function countFor(value: StatusFilter) {
    return questions.filter((q) => q.reviewStatus === value).length;
  }

  const activeLabel =
    filterOptions.find((o) => o.value === statusFilter)?.label ?? "";

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">
        {isAdmin ? "Questions" : "My questions"}
      </h2>

      <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap gap-2"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-full border px-4 py-1.5 text-sm focus-ring ${
                statusFilter === option.value
                  ? "border-accent-line bg-accent-soft text-accent-fg"
                  : "border-line-strong bg-page text-fg hover:bg-surface"
              }`}
            >
              {option.label}
              {option.value !== "ALL" && ` (${countFor(option.value)})`}
            </button>
          ))}
        </div>

        <Link to="/questions/new" className="btn-secondary text-sm focus-ring">
          + New Question
        </Link>
      </div>

      <div>
        {isLoading && <p>Loading questions...</p>}
        {error && <p role="alert">{error}</p>}
        {!isLoading && !error && filteredQuestions.length === 0 && (
          <p className="text-fg-muted">
            {statusFilter === "ALL"
              ? "No questions yet."
              : `No ${activeLabel.toLowerCase()} questions.`}
          </p>
        )}
        {!isLoading && !error && filteredQuestions.length > 0 && (
          <table className="w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-sm text-fg-muted">
                <th className="px-4 pb-1 font-normal">Question</th>
                <th className="hidden px-4 pb-1 font-normal sm:table-cell">
                  Category
                </th>
                <th className="px-4 pb-1 font-normal">Status</th>
                <th className="hidden px-4 pb-1 font-normal md:table-cell">
                  {isAdmin ? "Submitted by" : "Submitted on"}
                </th>
                {isAdmin && (
                  <th className="px-4 pb-1">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.id}>
                  <td className="cell max-w-xs truncate">
                    {question.content.text}
                  </td>
                  <td className="cell hidden sm:table-cell">
                    {question.category}
                  </td>
                  <td className="cell">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-sm ${statusStyles[question.reviewStatus]}`}
                    >
                      {statusLabels[question.reviewStatus]}
                    </span>
                  </td>
                  <td className="cell hidden md:table-cell">
                    {isAdmin
                      ? question.author.username
                      : new Date(question.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                  </td>
                  {isAdmin && (
                    <td className="cell text-right">
                      <Link
                        to={`/admin/questions/${question.id}`}
                        className="text-fg-muted hover:text-fg focus-ring"
                      >
                        {question.reviewStatus === "PENDING"
                          ? "Review"
                          : "Edit"}{" "}
                        &gt;
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
