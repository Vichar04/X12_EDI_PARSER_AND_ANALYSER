import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import DragNdrop from "@/components/DragNdrop";
import Header from "./components/Header";
import ViewPage from "./pages/ViewPage";

function UploadPage({ darkMode, onToggle }) {
  const navigate = useNavigate();

  const handleUploadSuccess = (data) => {
    navigate("/view", { state: { data } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header darkMode={darkMode} onToggle={onToggle} />
      <main className="flex justify-center items-center min-h-[calc(100vh-64px)] w-full px-4">
        <DragNdrop className="w-full max-w-md" onUploadSuccess={handleUploadSuccess} />
      </main>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const toggleDark = () => setDarkMode((d) => !d);

  return (
    <Routes>
      <Route path="/" element={<UploadPage darkMode={darkMode} onToggle={toggleDark} />} />
      <Route
        path="/view"
        element={
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header darkMode={darkMode} onToggle={toggleDark} />
            <ViewPage />
          </div>
        }
      />
    </Routes>
  );
}

export default App;
