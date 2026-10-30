import { Link } from "react-router";
import { useState, useEffect } from "react";
import { getQuestions } from "../api/questions.ts";
import type {
  QuestionListItem,
  QuestionReviewStatus,
} from "../api/questions.ts";

type StatusFilter = QuestionReviewStatus | "ALL";

// TODO: "Flagged" pill removed for now because the backend has no FLAGGED status yet.
const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "All", value: "ALL" },
];

const statusLabels: Record<QuestionReviewStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const statusStyles: Record<QuestionReviewStatus, string> = {
  DRAFT: "bg-surface border-line text-fg-muted",
  PENDING: "bg-warning-soft border-warning-line text-warning-fg",
  APPROVED: "bg-success-soft border-success-line text-success-fg",
  REJECTED: "bg-danger-soft border-danger-line text-danger-fg",
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const cellClass =
  "border-y border-line bg-surface px-4 py-3 first:rounded-l-md first:border-l last:rounded-r-md last:border-r";

export default function AdminQuestionsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
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
      <h2 className="mb-4 text-xl font-semibold">Questions</h2>

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
              className={`rounded-full border px-4 py-1.5 text-sm ${focusRing} ${
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

        <Link
          to="/admin/questions/new"
          className={`rounded-md border border-accent-line bg-accent-soft px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-line/50 ${focusRing}`}
        >
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
                  Submitted by
                </th>
                <th className="px-4 pb-1">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((question) => (
                <tr key={question.id}>
                  <td className={`${cellClass} max-w-xs truncate`}>
                    {question.text}
                  </td>
                  <td className={`${cellClass} hidden sm:table-cell`}>
                    {question.category ?? "Uncategorized"}
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-sm ${statusStyles[question.reviewStatus]}`}
                    >
                      {statusLabels[question.reviewStatus]}
                    </span>
                  </td>
                  <td className={`${cellClass} hidden md:table-cell`}>
                    {question.authorUsername}
                  </td>
                  <td className={`${cellClass} text-right`}>
                    <Link
                      to={`/admin/questions/${question.id}`}
                      className={`text-fg-muted hover:text-fg ${focusRing}`}
                    >
                      {question.reviewStatus === "PENDING" ? "Review" : "Edit"}{" "}
                      &gt;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
