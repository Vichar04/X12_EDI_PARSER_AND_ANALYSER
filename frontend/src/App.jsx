import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import UploadPage from "./pages/UploadPage";
import ViewPage from "./pages/ViewPage";
import About from "./pages/About";
import Docs from "./pages/Docs";

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
      <Route element={<Layout darkMode={darkMode} onToggle={toggleDark} />}>
        <Route path="/" element={<UploadPage />} />
        <Route path="/view" element={<ViewPage />} />
        <Route path="/docs" element={<Docs/>} />
        <Route path="/about" element={<About darkMode={darkMode} onToggle={toggleDark} />} />
      </Route>
    </Routes>
  );
}

export default App;