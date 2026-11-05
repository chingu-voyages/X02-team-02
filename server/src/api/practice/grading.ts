import type { CreateQuestionInput, PracticeAnswer } from "@x02/shared";

// Essay questions are not graded by the practice quiz.
export type GradableQuestion = Exclude<
  CreateQuestionInput,
  { answerType: "ESSAY" }
>;

export type GradedAnswer = {
  isCorrect: boolean;
  yourAnswer: string;
  correctAnswer: string;
};

const NO_ANSWER = "(no answer)";

// Lower-cases, trims, collapses repeated spaces, and drops trailing punctuation,
// so "Fifteen minutes." matches "fifteen minutes".
export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
}

// Multiple choice is all or nothing: the selected set must equal the correct set.
// Short answer matches any accepted answer after normalizing. A skipped question
// is incorrect.
export function gradeAnswer(
  question: GradableQuestion,
  answer: PracticeAnswer,
): GradedAnswer {
  if (question.answerType === "MULTIPLE_CHOICE") {
    const correctIds = new Set(question.answerKey.correctOptionIds);
    const selectedIds = new Set(answer.optionIds ?? []);

    const isCorrect =
      selectedIds.size === correctIds.size &&
      [...selectedIds].every((id) => correctIds.has(id));

    const textsFor = (ids: Set<string>) =>
      question.content.options
        .filter((option) => ids.has(option.id))
        .map((option) => option.text);

    return {
      isCorrect,
      yourAnswer: textsFor(selectedIds).join(", ") || NO_ANSWER,
      correctAnswer: textsFor(correctIds).join(", "),
    };
  }

  const typed = answer.text ?? "";
  const normalizedTyped = normalizeText(typed);

  const isCorrect =
    normalizedTyped !== "" &&
    question.answerKey.acceptedAnswers.some(
      (accepted) => normalizeText(accepted) === normalizedTyped,
    );

  return {
    isCorrect,
    yourAnswer: typed.trim() || NO_ANSWER,
    correctAnswer: question.answerKey.acceptedAnswers.join(" or "),
  };
}
