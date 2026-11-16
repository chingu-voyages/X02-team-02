import type { PracticeQuestion } from "@x02/shared";

// What the learner has entered for one question.
export type Entry = { optionIds: string[]; text: string };

type QuestionScreenProps = {
  question: PracticeQuestion;
  entry: Entry;
  position: number;
  total: number;
  message?: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onChooseOption: (optionId: string) => void;
  onText: (text: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export default function QuestionScreen({
  question,
  entry,
  position,
  total,
  message,
  headingRef,
  onChooseOption,
  onText,
  onPrevious,
  onNext,
}: QuestionScreenProps) {
  const isLast = position === total;

  return (
    <section>
      <p
        aria-live="polite"
        aria-label="Exam progress"
        className="text-sm text-fg-muted"
      >
        Question {position} of {total}
      </p>
      <progress
        value={position}
        max={total}
        className="w-full mb-6 rounded-full h-3"
      ></progress>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-1 text-xl font-semibold outline-none"
      >
        {question.text}
      </h2>

      {message && (
        <p role="alert" className="mt-3">
          {message}
        </p>
      )}

      {question.answerType === "MULTIPLE_CHOICE" ? (
        <fieldset className="mt-4 space-y-2">
          <legend className="mb-2 text-sm text-fg-muted">
            {question.multiple ? "Select all that apply" : "Choose one answer"}
          </legend>
          {question.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 rounded border border-line p-3"
            >
              <input
                type={question.multiple ? "checkbox" : "radio"}
                name={`question-${question.id}`}
                checked={entry.optionIds.includes(option.id)}
                onChange={() => onChooseOption(option.id)}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
      ) : (
        <div className="mt-4">
          <label
            htmlFor={`answer-${question.id}`}
            className="mb-1 block text-sm text-fg-muted"
          >
            Your answer
          </label>
          <input
            id={`answer-${question.id}`}
            type="text"
            value={entry.text}
            onChange={(event) => onText(event.target.value)}
            className="w-full rounded border border-line-strong p-2"
          />
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="btn-neutral"
          onClick={onPrevious}
          disabled={position === 1}
        >
          Previous
        </button>
        <button type="button" className="btn-primary" onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}
