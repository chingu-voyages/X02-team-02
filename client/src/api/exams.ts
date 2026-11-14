import type { GetCategoriesResponse, StartExamResponse } from "@x02/shared";
import { apiFetch } from "./client.ts";

export function getExamCategories() {
  return apiFetch<GetCategoriesResponse>("/exams/categories");
}

export function startExam(category: string) {
  return apiFetch<StartExamResponse>("/exams", {
    method: "POST",
    body: { category },
  });
}
