import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import CallDetail from "./pages/CallDetail.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calls/:id" element={<CallDetail />} />
      </Routes>
    </div>
  );
}
