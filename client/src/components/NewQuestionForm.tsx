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

      <div>
        <label htmlFor=""></label>
      </div>

      <div>
        <button
          type="submit"
          className="rounded-md border border-accent-line bg-accent-soft px-4 py-2 font-medium text-accent-fg hover:bg-accent-line/50 focus-ring"
        >
          Submit question
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 font-medium border-line-strong bg-page text-fg hover:bg-surface focus-ring"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
