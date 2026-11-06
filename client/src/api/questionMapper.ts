import type { QuestionFormValues } from "../schemas/questionSchema";
import { type CreateQuestionInput } from "@x02/shared";

export function toCreateQuestionPayload(
  formValues: QuestionFormValues,
): CreateQuestionInput {
  if (formValues.answerType === "MULTIPLE_CHOICE") {
    const options = formValues.options.map((o, i) => ({
      id: String.fromCharCode(97 + i),
      text: o.text,
    }));
    const correctOptIds = formValues.options
      .map((o, i) => (o.isCorrect ? String.fromCharCode(97 + i) : ""))
      .filter((o) => o.length);

    return {
      category: formValues.category,
      answerType: formValues.answerType,
      content: { text: formValues.questionText, options: options },
      answerKey: { correctOptionIds: correctOptIds },
    };
  }

  return {
    category: formValues.category,
    answerType: formValues.answerType,
    content: { text: formValues.questionText },
    answerKey: { acceptedAnswers: [formValues.modelAnswer] },
  };
}

export function toFormFieldName(backendField: string): string | null {
  if (backendField === "category") return "category";
  if (backendField === "content.text") return "questionText";

  const optionTextMatch = /^content\.options\.(\d+)\.text$/.exec(backendField);
  if (optionTextMatch) return `options.${optionTextMatch[1]}.text`;

  if (backendField === "content.options") return "options.root";
  if (backendField.startsWith("answerKey.correctOptionIds"))
    return "options.root";
  if (backendField.startsWith("answerKey.acceptedAnswers"))
    return "modelAnswer";

  return null;
}
