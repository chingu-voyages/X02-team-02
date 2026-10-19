import { Link } from "react-router";

export default function RegisterPage() {
  return (
    <main className="register-page">
      <h1>Register</h1>
      <p>Register page coming soon.</p>
      <p>Already have an account? <Link to="/login">Login</Link></p>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </main>
  );
}