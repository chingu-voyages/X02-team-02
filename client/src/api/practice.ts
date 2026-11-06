import type {
  PracticeAnswer,
  PracticeGradeResponse,
  PracticeQuestionsResponse,
} from "@x02/shared";
import { apiFetch } from "./client.ts";

// Public demo quiz. No login needed.
export function getPracticeQuestions(count = 20) {
  return apiFetch<PracticeQuestionsResponse>(`/practice/questions?count=${count}`);
}

export function gradePractice(answers: PracticeAnswer[]) {
  return apiFetch<PracticeGradeResponse>("/practice/grade", {
    method: "POST",
    body: { answers },
  });
}
