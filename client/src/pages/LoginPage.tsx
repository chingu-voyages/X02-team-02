import { Link } from "react-router";

export default function LoginPage() {
  return (
    <main className="login-page">
      <h1>Log in</h1>
      <p>Login page coming soon.</p>
      <p>Don't have an account? <Link to="/register">Register</Link></p>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </main>
  );
}