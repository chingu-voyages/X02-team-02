import { apiFetch } from "./client.ts";
import type {
  CreateQuestionInput,
  CreateQuestionResponse,
  LoadQuestionsResponse,
} from "@x02/shared";

export const createQuestion = (body: CreateQuestionInput) => {
  return apiFetch<CreateQuestionResponse>("/questions/create", {
    method: "POST",
    body,
  });
};

export async function getQuestions(): Promise<LoadQuestionsResponse> {
  return apiFetch<LoadQuestionsResponse>("/questions");
}
