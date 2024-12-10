import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAccessToken,
  getNickname,
  signIn,
  verifyEmail,
  getDeviceId,
} from "../../api";
import "./SignIn.scss";

const SignIn: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const response = await signIn(email, password);
      console.log(
        "Login successful",
        response.accessToken,
        response.refreshToken
      );

      const userId = JSON.parse(atob(getAccessToken()!.split(".")[1])).userId;
      const nickname = await getNickname(userId);
      localStorage.setItem("nickname", nickname);

      navigate("/dashboard");
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setIsVerificationStep(true);
      } else {
        setError(err.message || "login error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      const response = await verifyEmail(email, verificationCode, deviceId);
      console.log(
        "Verification successful",
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
      setError(err.message || "verification error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-in">
      <h2>{isVerificationStep ? "Verify Email" : "Sign In"}</h2>
      {error && <p className="error">{error}</p>}
      {!isVerificationStep ? (
        <form onSubmit={handleSignIn}>
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
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyEmail}>
          <div className="form-group">
            <label htmlFor="verificationCode">Verification Code:</label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Verification Code"
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>
        </form>
      )}
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
