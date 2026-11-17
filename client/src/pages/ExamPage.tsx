import { useEffect, useState, useRef } from "react";
import { useParams, Navigate, useNavigate } from "react-router";
import type { GetExamResponse, ExamQuestion } from "@x02/shared";
import { getExam, saveAnswer } from "../api/exams";
import { ApiError } from "../api/client";
import QuestionScreen from "../components/QuestionScreen";
import type { Entry } from "../components/QuestionScreen";

type Status = "loading" | "error" | "ready";

export default function ExamPage() {
  const { attemptId, position } = useParams<{
    attemptId: string;
    position: string;
  }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<GetExamResponse>();
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!attemptId) return;

    async function loadAttempt(id: string) {
      setMessage("");
      setStatus("loading");

      try {
        const response = await getExam(id);

        const loadedAnswers: Record<string, Entry> = {};

        response.questions.forEach((q) => {
          if (q.answer) {
            const entry: Entry = q.answer.optionIds
              ? { optionIds: q.answer.optionIds, text: "" }
              : { optionIds: [], text: q.answer.text ?? "" };
            loadedAnswers[q.id] = entry;
          }
        });

        setEntries(loadedAnswers);
        setAttempt(response);
        setStatus("ready");
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof ApiError && error.status === 404
            ? "The exam could not be found."
            : "Could not load the exam. Please try again.",
        );
      }
    }

    loadAttempt(attemptId);
  }, [attemptId]);

  // Move focus to the heading whenever the screen changes, so keyboard and
  // screen-reader users land at the top of the new content.
  useEffect(() => {
    headingRef.current?.focus();
  }, [status, position]);

  const question = attempt?.questions.find(
    (q) => q.position === Number(position),
  );

  function entryFor(question: ExamQuestion): Entry {
    return entries[question.id] ?? { optionIds: [], text: "" };
  }

  function setEntry(question: ExamQuestion, entry: Entry) {
    setEntries((prev) => ({ ...prev, [question.id]: entry }));
  }

  function chooseOption(
    question: Extract<ExamQuestion, { answerType: "MULTIPLE_CHOICE" }>,
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

  async function saveCurrent(question: ExamQuestion) {
    if (!attemptId) return false;

    const answer = entryFor(question);
    const body =
      question.answerType === "MULTIPLE_CHOICE"
        ? { optionIds: answer.optionIds }
        : { text: answer.text };

    try {
      await saveAnswer(attemptId, question.id, body);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      {status === "loading" && <p role="status">Loading question...</p>}
      {status === "error" && <p role="alert">{message}</p>}
      {status === "ready" && !question && (
        <Navigate to={`/exams/${attemptId}/questions/1`} replace />
      )}
      {status === "ready" && attempt && question && (
        <QuestionScreen
          question={question}
          entry={entryFor(question)}
          position={question.position}
          total={attempt.questions.length}
          headingRef={headingRef}
          message={message}
          onNext={async () => {
            setMessage("");
            const saved = await saveCurrent(question);
            if (!saved) {
              setMessage("Could not save your answer");
              return;
            }
            navigate(`/exams/${attemptId}/questions/${Number(position) + 1}`);
          }}
          onPrevious={async () => {
            setMessage("");
            const saved = await saveCurrent(question);
            if (!saved) {
              setMessage("Could not save your answer");
              return;
            }
            navigate(`/exams/${attemptId}/questions/${Number(position) - 1}`);
          }}
          onChooseOption={(optionId) => {
            if (question.answerType === "MULTIPLE_CHOICE") {
              chooseOption(question, optionId);
            }
          }}
          onText={(text) => setEntry(question, { ...entryFor(question), text })}
        />
      )}
    </section>
  );
}
