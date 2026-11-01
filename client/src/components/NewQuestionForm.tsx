import { useState } from "react";

type AnswerType = "multipleChoice" | "shortAnswer";
type OptionDraft = { id: string; text: string; isCorrect: boolean };

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

function newOption(): OptionDraft {
  return { id: crypto.randomUUID(), text: "", isCorrect: false };
}

export default function NewQuestionForm() {
  const [answerType, setAnswerType] = useState<AnswerType>("multipleChoice");
  const [options, setOptions] = useState<OptionDraft[]>([
    newOption(),
    newOption(),
  ]);

  function updateOption(id: string, changes: Partial<OptionDraft>) {
    setOptions((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...changes } : o)),
    );
  }

  function addOption() {
    setOptions((prev) =>
      prev.length < MAX_OPTIONS ? [...prev, newOption()] : prev,
    );
  }

  function removeOption(id: string) {
    setOptions((prev) =>
      prev.length > MIN_OPTIONS ? prev.filter((o) => o.id !== id) : prev,
    );
  }

  return (
    <form className="max-w-xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">
            Category
          </label>
          <select name="category" id="category" className="field focus-ring">
            <option value="">Select a category</option>
            <option value="PSM">PSM</option>
            <option value="PSPO">PSPO</option>
          </select>
        </div>
        <div>
          <label htmlFor="answerType" className="label">
            Answer type
          </label>
          <select
            name="answerType"
            id="answerType"
            className="field focus-ring"
            value={answerType}
            onChange={(e) => setAnswerType(e.target.value as AnswerType)}
          >
            <option value="multipleChoice">Multiple choice</option>
            <option value="shortAnswer">Short answer</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="questionText" className="label">
          Question text
        </label>
        <textarea
          name="questionText"
          id="questionText"
          rows={5}
          placeholder="Write your question here..."
          className="field focus-ring"
        ></textarea>
      </div>

      {answerType === "multipleChoice" ? (
        <fieldset className="space-y-2">
          <legend className="label">
            Answer options (tick the correct ones)
          </legend>

          {options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return (
              <div key={option.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  aria-label={`Option ${letter} is correct`}
                  checked={option.isCorrect}
                  onChange={(e) =>
                    updateOption(option.id, { isCorrect: e.target.checked })
                  }
                  className="size-5 shrink-0 focus-ring"
                />
                <input
                  type="text"
                  aria-label={`Option ${letter} text`}
                  placeholder={`Option ${letter}`}
                  value={option.text}
                  onChange={(e) =>
                    updateOption(option.id, { text: e.target.value })
                  }
                  className="field focus-ring"
                />
                <button
                  type="button"
                  aria-label={`Remove option ${letter}`}
                  disabled={options.length <= MIN_OPTIONS}
                  onClick={() => removeOption(option.id)}
                  className="rounded-md border border-line-strong bg-page px-3 py-2 text-fg hover:bg-surface disabled:opacity-40 focus-ring"
                >
                  x
                </button>
              </div>
            );
          })}

          <button
            type="button"
            disabled={options.length >= MAX_OPTIONS}
            onClick={addOption}
            className="text-sm font-medium text-accent-fg hover:underline disabled:opacity-40 focus-ring"
          >
            + Add option
          </button>
        </fieldset>
      ) : (
        <div>
          <label htmlFor="modelAnswer" className="label">
            Model answer
          </label>
          <textarea
            name="modelAnswer"
            id="modelAnswer"
            rows={3}
            placeholder="What would a correct answer look like?"
            className="field focus-ring"
          ></textarea>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-md border border-accent-line bg-accent-soft px-4 py-2 font-medium text-accent-fg hover:bg-accent-line/50 focus-ring"
        >
          Submit question
        </button>
        <button
          type="button"
          // TODO - navigate back to hthe question list
          className="rounded-md border px-4 py-2 font-medium border-line-strong bg-page text-fg hover:bg-surface focus-ring"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
