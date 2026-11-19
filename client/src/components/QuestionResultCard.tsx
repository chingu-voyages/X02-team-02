type QuestionResultCardProps = {
  position: number;
  text: string;
  isCorrect: boolean;
  yourAnswer: string;
  correctAnswer: string;
};

export default function QuestionResultCard({
  position,
  text,
  isCorrect,
  yourAnswer,
  correctAnswer,
}: QuestionResultCardProps) {
  return (
    <li
      className={`rounded border p-4 ${isCorrect ? "bg-success-soft border-success-line" : "bg-danger-soft border-danger-line"}`}
    >
      <p className="font-medium">
        {position}. {text}
      </p>
      <p className="mt-1">
        <strong>{isCorrect ? "✓ Correct" : "✗ Incorrect"}</strong>
      </p>
      <p className="mt-1 text-fg-muted">
        <span className="font-medium">Your answer:</span> {yourAnswer}
      </p>
      {!isCorrect && (
        <p className="text-fg-muted">
          <span className="font-medium">Correct answer:</span> {correctAnswer}
        </p>
      )}
    </li>
  );
}
