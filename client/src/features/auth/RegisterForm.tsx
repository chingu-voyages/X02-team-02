export default function RegisterForm() {
  return (
    <form action="">
      <div>
        <label htmlFor="username">Username</label>
        <input type="text" id="username" />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" id="email" />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" id="password" />
      </div>
      <div>
        <label htmlFor="confirmPassword">Confirm password</label>
        <input type="confirmPassword" id="confirmPassword" />
      </div>

      <button type="submit">Register</button>
    </form>
  );
}
