import type { Question } from "../pages/AdminQuestionsPage";

const placeholderQuestions: Question[] = [
  {
    id: "1",
    text: "Who is responsible for maximizing the value of the product?",
    category: "PSPO",
    type: "multiple_choice",
    status: "pending",
    submittedBy: "user1",
    createdAt: "2026-10-20T10:00:00Z",
  },
  {
    id: "2",
    text: "How long is a Sprint at most?",
    category: "PSM",
    type: "short_answer",
    status: "approved",
    submittedBy: "user1",
    createdAt: "2026-10-21T09:30:00Z",
  },
  {
    id: "3",
    text: "Who can cancel a Sprint?",
    category: "CSM",
    type: "multiple_choice",
    status: "flagged",
    submittedBy: "admin1",
    createdAt: "2026-10-22T14:15:00Z",
  },
  {
    id: "4",
    text: "What is the purpose of the Daily Scrum?",
    category: "PSM",
    type: "multiple_choice",
    status: "approved",
    submittedBy: "admin1",
    createdAt: "2026-10-23T08:45:00Z",
  },
];

export async function getQuestions(): Promise<Question[]> {
  // TODO: replace with apiFetch once the server endpoint exists
  return placeholderQuestions;
}
