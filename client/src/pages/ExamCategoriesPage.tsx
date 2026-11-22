import { useState, useEffect } from "react";
import { getExamCategories } from "../api/exams";
import { Link } from "react-router";

type Status = "loading" | "error" | "ready";

export default function ExamCategoriesPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await getExamCategories();
        setCategories(response.categories);
        setStatus("ready");
      } catch {
        setStatus("error");
        setMessage("Could not load the categories");
      }
    }

    loadCategories();
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Choose a practice exam</h2>
      <p className="mb-8 mt-1 text-fg-muted">
        Pick the certification you want to practice for.
      </p>

      {status === "loading" && <p role="status">Loading categories...</p>}

      {status === "error" && <p role="alert">{message}</p>}

      {status === "ready" && categories.length === 0 && (
        <p>No exams available yet</p>
      )}

      {status === "ready" && categories.length > 0 && (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
          {categories.map((category) => (
            <li
              key={category}
              className="flex flex-col items-center gap-6 rounded border border-line p-4"
            >
              <h3 className="text-lg font-semibold">{category}</h3>
              <Link
                to={`/exams/${encodeURIComponent(category)}/start`}
                className="btn-secondary mt-auto w-full text-center"
              >
                Start
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
