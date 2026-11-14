import { useParams } from "react-router";

export default function ExamPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  return (
    <section className="mx-auto max-w-md">
      <h2>Exam Page placeholder</h2>
      <p>AttemptId: {attemptId}</p>
    </section>
  );
}
