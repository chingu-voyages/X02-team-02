import { Link } from "react-router";

export default function HomePage() {
	return (
		<main>
			<h1>Welcome</h1>
			<p>This is the home page.</p>
			<nav>
				<Link to="/login">Login</Link>
			</nav>
		</main>
	);
}
