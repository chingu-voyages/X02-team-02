import { Link } from "react-router";
import RegisterForm from "../components/RegisterForm.tsx";

export default function RegisterPage() {
  return (
    <main className="register-page">
      <h1>Register</h1>
      <RegisterForm />
      <p>Register page coming soon.</p>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </main>
  );
}
