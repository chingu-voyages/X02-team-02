import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestionsPage from "./QuestionsPage";
import { getQuestions } from "../api/questions";
import type { LoadQuestionsResponse } from "@x02/shared";

vi.mock("../api/questions.ts", () => ({ getQuestions: vi.fn() }));
const mockGetQuestions = vi.mocked(getQuestions);
const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock("../auth/useAuth.ts", () => ({ useAuth: mockUseAuth }));

const data: LoadQuestionsResponse = {
  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  questions: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      createdAt: "2026-10-20T10:00:00Z",
      updatedAt: "2026-10-29T10:00:00Z",
      answerType: "MULTIPLE_CHOICE",
      content: {
        text: "Who is responsible for maximizing the value of the product?",
      },
      category: "PSPO",
      reviewStatus: "PENDING",
      difficulty: null,
      authorId: "user1",
      author: { username: "name1" },
    },
    {
      id: "21111111-1111-1111-1111-111111111111",
      createdAt: "2026-10-20T10:00:00Z",
      updatedAt: "2026-10-29T10:00:00Z",
      answerType: "SHORT_ANSWER",
      content: { text: "How long is a Sprint at most?" },
      category: "PSM",
      reviewStatus: "APPROVED",
      difficulty: null,
      authorId: "user1",
      author: { username: "name1" },
    },
  ],
};

describe("QuestionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "admin-1", role: "ADMIN" },
      status: "authenticated",
    });
  });

  it("shows loading, then the questions", async () => {
    mockGetQuestions.mockResolvedValue(data);
    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Loading questions...")).toBeInTheDocument();
    expect(
      await screen.findByText(
        "Who is responsible for maximizing the value of the product?",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Loading questions...")).not.toBeInTheDocument();
  });

  it("filters approved questions correctly", async () => {
    const user = userEvent.setup();
    mockGetQuestions.mockResolvedValue(data);

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>,
    );

    // Default filter: Pending is selected, only pending question is listed
    expect(
      await screen.findByText(
        "Who is responsible for maximizing the value of the product?",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pending/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByText("How long is a Sprint at most?"),
    ).not.toBeInTheDocument();

    // Switch to Approved
    await user.click(screen.getByRole("button", { name: /approved/i }));

    expect(screen.getByRole("button", { name: /approved/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText("How long is a Sprint at most?"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Who is responsible for maximizing the value of the product?",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows counts from the full list and keeps them when the filter changes", async () => {
    const user = userEvent.setup();
    mockGetQuestions.mockResolvedValue(data);

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("button", { name: "Pending (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Approved (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rejected (0)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();

    // Switch filter: counts stay same
    await user.click(screen.getByRole("button", { name: /approved/i }));

    expect(
      screen.getByRole("button", { name: "Pending (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Approved (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rejected (0)" }),
    ).toBeInTheDocument();
  });

  it("shows 'No rejected questions.' when the rejected filter matches nothing", async () => {
    const user = userEvent.setup();
    mockGetQuestions.mockResolvedValue(data);

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("button", { name: "Pending (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rejected (0)" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /rejected/i }));
    expect(screen.getByText("No rejected questions.")).toBeInTheDocument();
  });

  it("shows 'No questions yet.' with an empty list", async () => {
    const user = userEvent.setup();
    mockGetQuestions.mockResolvedValue({ ...data, questions: [] });

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("No pending questions."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("No questions yet.")).toBeInTheDocument();
  });

  it("shows an error message and no table when loading fails", async () => {
    mockGetQuestions.mockRejectedValue(new Error("Network error"));

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't load questions.",
    );

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Loading questions...")).not.toBeInTheDocument();
    expect(screen.queryByText(/no .*questions/i)).not.toBeInTheDocument();
  });

  it("shows the learner view: own heading, All filter, date column, no admin parts", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "learner-1", role: "LEARNER" },
      status: "authenticated",
    });
    mockGetQuestions.mockResolvedValue(data);

    render(
      <MemoryRouter>
        <QuestionsPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "My questions" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByText(
        "Who is responsible for maximizing the value of the product?",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("How long is a Sprint at most?"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Submitted on" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Submitted by")).not.toBeInTheDocument();
    expect(screen.queryByText("maria")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /review|edit/i }),
    ).not.toBeInTheDocument();
  });
});
