import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PracticeGradeResponse, PracticeQuestionsResponse } from "@x02/shared";
import PracticeExamPage from "./PracticeExamPage";
import { ApiError } from "../api/client";
import { getPracticeQuestions, gradePractice } from "../api/practice";

vi.mock("../api/practice.ts", () => ({
  getPracticeQuestions: vi.fn(),
  gradePractice: vi.fn(),
}));

const mockGet = vi.mocked(getPracticeQuestions);
const mockGrade = vi.mocked(gradePractice);

const questions: PracticeQuestionsResponse = {
  questions: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      answerType: "MULTIPLE_CHOICE",
      text: "Who owns the Product Backlog?",
      multiple: false,
      options: [
        { id: "a", text: "The Product Owner" },
        { id: "b", text: "The Scrum Master" },
      ],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      answerType: "MULTIPLE_CHOICE",
      text: "Which are Scrum events?",
      multiple: true,
      options: [
        { id: "a", text: "Sprint Planning" },
        { id: "b", text: "Daily Scrum" },
        { id: "c", text: "Gantt Review" },
      ],
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      answerType: "SHORT_ANSWER",
      text: "How many minutes is the Daily Scrum?",
    },
  ],
};

const graded: PracticeGradeResponse = {
  score: 2,
  total: 3,
  results: [
    {
      questionId: questions.questions[0].id,
      text: "Who owns the Product Backlog?",
      yourAnswer: "The Product Owner",
      correctAnswer: "The Product Owner",
      isCorrect: true,
    },
    {
      questionId: questions.questions[1].id,
      text: "Which are Scrum events?",
      yourAnswer: "Sprint Planning",
      correctAnswer: "Sprint Planning, Daily Scrum",
      isCorrect: false,
    },
    {
      questionId: questions.questions[2].id,
      text: "How many minutes is the Daily Scrum?",
      yourAnswer: "15",
      correctAnswer: "15",
      isCorrect: true,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <PracticeExamPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PracticeExamPage", () => {
  it("shows one question at a time, then the results", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(questions);
    mockGrade.mockResolvedValue(graded);

    renderPage();
    await user.click(screen.getByRole("button", { name: "Start quiz" }));

    // Question 1: single answer, so radio buttons.
    expect(await screen.findByText("Question 1 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Which are Scrum events?")).not.toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "The Product Owner" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Question 2: several correct answers, so checkboxes.
    expect(await screen.findByText("Question 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Select all that apply")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Sprint Planning" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    // Question 3: short answer, and the last one says Finish.
    expect(await screen.findByText("Question 3 of 3")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your answer"), "15");
    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(await screen.findByText("You got 2 of 3 correct")).toBeInTheDocument();
    expect(screen.getByText("✗ Incorrect")).toBeInTheDocument();
    expect(screen.getByText("Sprint Planning, Daily Scrum")).toBeInTheDocument();

    expect(mockGrade).toHaveBeenCalledWith([
      { questionId: questions.questions[0].id, optionIds: ["a"] },
      { questionId: questions.questions[1].id, optionIds: ["a"] },
      { questionId: questions.questions[2].id, text: "15" },
    ]);
  });

  it("keeps earlier answers when going back", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(questions);

    renderPage();
    await user.click(screen.getByRole("button", { name: "Start quiz" }));
    await user.click(await screen.findByRole("radio", { name: "The Scrum Master" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(await screen.findByRole("button", { name: "Previous" }));

    expect(await screen.findByRole("radio", { name: "The Scrum Master" })).toBeChecked();
  });

  it("says so when the quiz is turned off on the server", async () => {
    const user = userEvent.setup();
    mockGet.mockRejectedValue(new ApiError(404, "Not found."));

    renderPage();
    await user.click(screen.getByRole("button", { name: "Start quiz" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("turned off");
  });

  it("says so when there are no questions yet", async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({ questions: [] });

    renderPage();
    await user.click(screen.getByRole("button", { name: "Start quiz" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("seed script");
  });
});
