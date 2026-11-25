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
  const avgPercent = percents.reduce((sum, n) => sum + n, 0) / percents.length;

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
        <div className="grid grid-cols-1 md:grid-cols-[30%_65%] gap-8">
          <div>
            <div>
              <label htmlFor="categoryFilter" className="sr-only">
                Category filter
              </label>
              <select
                id="categoryFilter"
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
            <div>
              <p>
                <span>Best score</span>
              </p>
            </div>
          </div>
          <div>
            <h3>Past attempts</h3>
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
                          {a.score} / {a.total}
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
