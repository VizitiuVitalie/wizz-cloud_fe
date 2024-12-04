import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken, getNickname, signUp } from "../../api";
import "./SignUp.scss";

const SignUp: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await signUp(fullName, email, password);
      console.log(
        "Registration successful",
        response.accessToken,
        response.refreshToken
      );

      localStorage.setItem("access_token", response.accessToken);
      localStorage.setItem("refresh_token", response.refreshToken);

      const userId = JSON.parse(atob(getAccessToken()!.split(".")[1])).userId;
      const nickname = await getNickname(userId);
      localStorage.setItem("nickname", nickname);

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "registration error");
    }
  };

  return (
    <div className="sign-up">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Username"
            required
          />
        </div>
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
        <button type="submit">Sign Up</button>
      </form>
      <p>
        Already have an account?{" "}
        <button onClick={() => navigate("/signin")} className="link-button">
          Sign in
        </button>
      </p>
    </div>
  );
};

export default SignUp;
