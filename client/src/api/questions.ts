import { apiFetch } from "./client.ts";
import { type CreateQuestionInput } from "@x02/shared";

export type QuestionReviewStatus =
  "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "FLAGGED";

// TODO: add options to content when the detail page is built
type CreatedQuestion = {
  id: string;
  createdAt: string;
  updatedAt: string;
  answerType: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "ESSAY";
  content: { text: string };
  category: string;
  difficulty: string | null;
  reviewStatus: QuestionReviewStatus;
  authorId: string;
};

type CreateQuestionResponse = {
  message: string;
  question: CreatedQuestion;
};

// TODO: add options to content when the detail page is built
export type LoadedQuestion = CreatedQuestion;

export type LoadQuestionsResponse = {
  questions: LoadedQuestion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const createQuestion = (body: CreateQuestionInput) => {
  return apiFetch<CreateQuestionResponse>("/questions/create", {
    method: "POST",
    body,
  });
};

export async function getQuestions(): Promise<LoadQuestionsResponse> {
  return apiFetch<LoadQuestionsResponse>("/questions");
}
