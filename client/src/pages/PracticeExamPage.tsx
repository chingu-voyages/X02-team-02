import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type {
  PracticeAnswer,
  PracticeGradeResponse,
  PracticeQuestion,
} from "@x02/shared";
import { ApiError } from "../api/client.ts";
import { getPracticeQuestions, gradePractice } from "../api/practice.ts";

const QUESTION_COUNT = 20;

type Stage = "intro" | "loading" | "question" | "submitting" | "results" | "error";

// What the learner has entered for one question.
type Entry = { optionIds: string[]; text: string };

const button =
  "rounded bg-fg px-4 py-2 text-page hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";
const secondaryButton =
  "rounded border border-line-strong px-4 py-2 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50";

// A public demo of the quiz mechanic: no login needed. The server can switch the
// quiz off (for example in production), in which case the start request is a 404.
export default function PracticeExamPage() {
  const [stage, setStage] = useState<Stage>("intro");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [result, setResult] = useState<PracticeGradeResponse | null>(null);
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the heading whenever the screen changes, so keyboard and
  // screen-reader users land at the top of the new content.
  useEffect(() => {
    headingRef.current?.focus();
  }, [stage, index]);

  async function start() {
    setStage("loading");
    setMessage("");

    try {
      const response = await getPracticeQuestions(QUESTION_COUNT);

      if (response.questions.length === 0) {
        setMessage("There are no practice questions yet. Run the seed script first.");
        setStage("error");
        return;
      }

      setQuestions(response.questions);
      setEntries({});
      setResult(null);
      setIndex(0);
      setStage("question");
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 404
          ? "The practice quiz is turned off on this server."
          : "Could not load the quiz. Is the server running?",
      );
      setStage("error");
    }
  }

  function entryFor(question: PracticeQuestion): Entry {
    return entries[question.id] ?? { optionIds: [], text: "" };
  }

  function setEntry(question: PracticeQuestion, entry: Entry) {
    setEntries((previous) => ({ ...previous, [question.id]: entry }));
  }

  function chooseOption(
    question: Extract<PracticeQuestion, { answerType: "MULTIPLE_CHOICE" }>,
    optionId: string,
  ) {
    const current = entryFor(question);

    if (!question.multiple) {
      setEntry(question, { ...current, optionIds: [optionId] });
      return;
    }

    const optionIds = current.optionIds.includes(optionId)
      ? current.optionIds.filter((id) => id !== optionId)
      : [...current.optionIds, optionId];

    setEntry(question, { ...current, optionIds });
  }

  async function finish() {
    setStage("submitting");

    const answers: PracticeAnswer[] = questions.map((question) => {
      const entry = entryFor(question);

      return question.answerType === "MULTIPLE_CHOICE"
        ? { questionId: question.id, optionIds: entry.optionIds }
        : { questionId: question.id, text: entry.text };
    });

    try {
      setResult(await gradePractice(answers));
      setStage("results");
    } catch {
      setMessage("Could not grade the quiz. Your answers are still here, so try again.");
      setStage("question");
    }
  }

  const heading = "text-xl font-semibold outline-none";

  return (
    <main className="mx-auto max-w-2xl p-6">
      {stage === "intro" && (
        <section>
          <h1 ref={headingRef} tabIndex={-1} className={heading}>
            Practice exam
          </h1>
          <p className="mt-2 text-fg-muted">
            Answer {QUESTION_COUNT} random questions, one at a time. You will see your score
            and the correct answers at the end. No login needed.
          </p>
          <button type="button" className={`mt-4 ${button}`} onClick={start}>
            Start quiz
          </button>
        </section>
      )}

      {(stage === "loading" || stage === "submitting") && (
        <p role="status">{stage === "loading" ? "Loading questions…" : "Checking your answers…"}</p>
      )}

      {stage === "error" && (
        <section>
          <h1 ref={headingRef} tabIndex={-1} className={heading}>
            Practice exam
          </h1>
          <p role="alert" className="mt-2">
            {message}
          </p>
          <button type="button" className={`mt-4 ${button}`} onClick={start}>
            Try again
          </button>
        </section>
      )}

      {stage === "question" && questions[index] && (
        <QuestionScreen
          key={questions[index].id}
          question={questions[index]}
          entry={entryFor(questions[index])}
          position={index + 1}
          total={questions.length}
          message={message}
          headingRef={headingRef}
          onChooseOption={(optionId) => {
            const question = questions[index];
            if (question.answerType === "MULTIPLE_CHOICE") chooseOption(question, optionId);
          }}
          onText={(text) => setEntry(questions[index], { ...entryFor(questions[index]), text })}
          onPrevious={() => {
            setMessage("");
            setIndex(index - 1);
          }}
          onNext={() => {
            setMessage("");
            if (index === questions.length - 1) {
              void finish();
            } else {
              setIndex(index + 1);
            }
          }}
        />
      )}

      {stage === "results" && result && (
        <section>
          <h1 ref={headingRef} tabIndex={-1} className={heading}>
            You got {result.score} of {result.total} correct
          </h1>
          <ol className="mt-4 space-y-4">
            {result.results.map((item, position) => (
              <li key={item.questionId} className="rounded border border-line bg-surface p-4">
                <p className="font-medium">
                  {position + 1}. {item.text}
                </p>
                <p className="mt-1">
                  <strong>{item.isCorrect ? "✓ Correct" : "✗ Incorrect"}</strong>
                </p>
                <p className="mt-1 text-fg-muted">
                  <span className="font-medium">Your answer:</span> {item.yourAnswer}
                </p>
                {!item.isCorrect && (
                  <p className="text-fg-muted">
                    <span className="font-medium">Correct answer:</span> {item.correctAnswer}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-6 flex gap-3">
            <button type="button" className={button} onClick={start}>
              Start another quiz
            </button>
            <Link to="/" className={secondaryButton}>
              Home
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

type QuestionScreenProps = {
  question: PracticeQuestion;
  entry: Entry;
  position: number;
  total: number;
  message: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onChooseOption: (optionId: string) => void;
  onText: (text: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

function QuestionScreen({
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
      <p aria-live="polite" className="text-sm text-fg-muted">
        Question {position} of {total}
      </p>
      <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-semibold outline-none">
        {question.text}
      </h1>

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
            <label key={option.id} className="flex items-center gap-2 rounded border border-line p-3">
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
          <label htmlFor={`answer-${question.id}`} className="mb-1 block text-sm text-fg-muted">
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
        <button type="button" className={secondaryButton} onClick={onPrevious} disabled={position === 1}>
          Previous
        </button>
        <button type="button" className={button} onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </section>
  );
}
