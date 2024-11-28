import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn/SignIn";
import SignUp from "./pages/SignUp/SignUp";
import CloudDashboard from "./pages/CloudDashboard/CloudDashboard";

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<CloudDashboard />} />
    </Routes>
  </Router>
);

export default App;
