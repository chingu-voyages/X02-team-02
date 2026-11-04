import { Link } from "react-router";
import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="login-page">
      <h2>Log in</h2>
      <LoginForm />
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </main>
  );
}
