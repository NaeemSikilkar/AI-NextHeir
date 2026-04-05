import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import Dashboard from "@/pages/Dashboard";
import ScenarioCreate from "@/pages/ScenarioCreate";
import ResultsDashboard from "@/pages/ResultsDashboard";
import CompareScenarios from "@/pages/CompareScenarios";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/scenario/new" element={<ProtectedRoute><ScenarioCreate /></ProtectedRoute>} />
          <Route path="/scenario/:id/edit" element={<ProtectedRoute><ScenarioCreate /></ProtectedRoute>} />
          <Route path="/scenario/:id/results" element={<ProtectedRoute><ResultsDashboard /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><CompareScenarios /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
