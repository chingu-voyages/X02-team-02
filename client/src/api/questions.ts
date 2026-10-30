export type QuestionReviewStatus =
  "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

// If the API response looks different getQuestions() can map it onto this shape or FE can be changed to match the API response.
export type QuestionListItem = {
  id: string;
  text: string;
  category: string | null;
  reviewStatus: QuestionReviewStatus;
  authorUsername: string;
  createdAt: string;
};

const placeholderQuestions: QuestionListItem[] = [
  {
    id: "1",
    text: "Who is responsible for maximizing the value of the product?",
    category: "PSPO",
    reviewStatus: "PENDING",
    authorUsername: "user1",
    createdAt: "2026-10-20T10:00:00Z",
  },
  {
    id: "2",
    text: "How long is a Sprint at most?",
    category: "PSM",
    reviewStatus: "APPROVED",
    authorUsername: "user1",
    createdAt: "2026-10-21T09:30:00Z",
  },
  {
    id: "3",
    text: "Who can cancel a Sprint?",
    category: null,
    reviewStatus: "REJECTED",
    authorUsername: "admin1",
    createdAt: "2026-10-22T14:15:00Z",
  },
  {
    id: "4",
    text: "What is the purpose of the Daily Scrum?",
    category: "PSM",
    reviewStatus: "APPROVED",
    authorUsername: "admin1",
    createdAt: "2026-10-23T08:45:00Z",
  },
];

export async function getQuestions(): Promise<QuestionListItem[]> {
  // TODO: replace with apiFetch once the server endpoint exists and map the response
  return placeholderQuestions;
}
