import { useState, useEffect, useRef } from "react";
import { getExamsHistory } from "../api/exams";
import type { ExamHistoryItem } from "@x02/shared";
import { Link } from "react-router";
import { scorePercent } from "../utils/utils";

type Status = "loading" | "error" | "ready";

export default function JournalPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [status, setStatus] = useState<Status>("loading");
  const [attempts, setAttempts] = useState<ExamHistoryItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    async function loadExamsHistory() {
      try {
        const response = await getExamsHistory();
        setAttempts(response.attempts);
        setStatus("ready");
      } catch {
        setStatus("error");
        setMessage("Could not load past attempts");
      }
    }

    loadExamsHistory();
  }, []);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const categories = [...new Set(attempts.map((a) => a.category))];
  const filteredAttempts =
    categoryFilter === "ALL"
      ? attempts
      : attempts.filter((a) => a.category === categoryFilter);
  const percents = filteredAttempts.map((a) => scorePercent(a.score, a.total));
  const bestPercent = Math.max(...percents);
  const avgPercent = Math.round(
    percents.reduce((sum, n) => sum + n, 0) / percents.length,
  );

  return (
    <section>
      <h2
        className="text-xl font-semibold outline-none mb-6"
        ref={headingRef}
        tabIndex={-1}
      >
        My journal
      </h2>
      {status === "loading" && <p role="status">Loading past attempts...</p>}
      {status === "error" && <p role="alert">{message}</p>}
      {status === "ready" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            {/* Category filter */}
            <div>
              <label htmlFor="categoryFilter" className="sr-only">
                Category filter
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="field"
              >
                <option value="ALL">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            {/* Stats cards */}
            {filteredAttempts.length > 0 && (
              <div className="mt-6 grid grid-cols-3 md:grid-cols-1 gap-3">
                <div className="bg-surface border border-line rounded-lg p-4 flex flex-col justify-between">
                  <p className="text-sm text-fg-muted mb-1">Best score</p>
                  <span className="text-2xl font-medium text-fg">
                    {bestPercent}%
                  </span>
                </div>
                <div className="bg-surface border border-line rounded-lg p-4">
                  <p className="text-sm text-fg-muted mb-1">Average score</p>
                  <span className="text-2xl font-medium text-fg">
                    {avgPercent}%
                  </span>
                </div>
                <div className="bg-surface border border-line rounded-lg p-4">
                  <p className="text-sm text-fg-muted mb-1">Total attempts</p>
                  <span className="text-2xl font-medium text-fg">
                    {filteredAttempts.length}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="md:col-span-2 md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-2">
            <h3 className="text-lg font-semibold outline-none mb-2">
              Past attempts
            </h3>
            {attempts.length === 0 && (
              <p>
                No past attempts yet. Finish an exam to view the attempt here.{" "}
                <Link to="/exams">Choose an exam</Link>
              </p>
            )}
            {attempts.length > 0 && filteredAttempts.length === 0 && (
              <p>No past attempts in the {categoryFilter} category.</p>
            )}
            {attempts.length > 0 && filteredAttempts.length > 0 && (
              <table className="w-full border-separate border-spacing-y-2 text-left">
                <thead className="sr-only">
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Score</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttempts.map((a) => {
                    const formattedDate = new Date(a.finishedAt).toLocaleString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      },
                    );
                    return (
                      <tr key={a.attemptId} className="group relative">
                        <td className="cell whitespace-nowrap group-hover:bg-line group-focus-within:bg-line">
                          {formattedDate}
                        </td>
                        <td className="cell group-hover:bg-line group-focus-within:bg-line">
                          <Link
                            to={`/exams/${a.attemptId}/result`}
                            className="after:absolute after:inset-0"
                          >
                            {a.category}
                          </Link>
                        </td>
                        <td className="cell whitespace-nowrap text-right group-hover:bg-line group-focus-within:bg-line">
                          {scorePercent(a.score, a.total)}% &gt;
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
