import type {
  GetCategoriesResponse,
  StartExamResponse,
  GetExamResponse,
  SaveAnswerRequest,
} from "@x02/shared";
import { apiFetch } from "./client.ts";

export function getExamCategories() {
  return apiFetch<GetCategoriesResponse>("/exams/categories");
}

export function startExam(category: string, count?: number) {
  return apiFetch<StartExamResponse>("/exams", {
    method: "POST",
    body: { category, count },
  });
}

export function getExam(attemptId: string) {
  return apiFetch<GetExamResponse>(`/exams/${attemptId}`);
}

export function saveAnswer(
  attemptId: string,
  questionId: string,
  answer: SaveAnswerRequest,
) {
  return apiFetch<void>(`/exams/${attemptId}/questions/${questionId}/answer`, {
    method: "PUT",
    body: answer,
  });
}
