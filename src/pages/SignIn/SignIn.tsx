import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNickname, signIn } from "../../api";
import "./SignIn.scss";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await signIn(email, password);
      console.log(
        "Login successful",
        response.accessToken,
        response.refreshToken
      );

      const decodedToken = JSON.parse(atob(response.accessToken.split(".")[1]));
      const userId = decodedToken.userId;

      const nickname = await getNickname(userId);
      localStorage.setItem("nickname", nickname);

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "login error");
    }
  };

  return (
    <div className="sign-in">
      <h2>Sign In</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">Sign In</button>
      </form>
      <p>
        Don't have an account?{" "}
        <button onClick={() => navigate("/signup")} className="link-button">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default SignIn;