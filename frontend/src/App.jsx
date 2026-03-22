import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import DragNdrop from "@/components/DragNdrop";
import Header from "./components/Header";
import ViewPage from "./pages/ViewPage";

function UploadPage({ darkMode, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const invalidMsg = location.state?.invalidMsg ?? null;

  const handleUploadSuccess = (data) => {
    if (data?.valid === false) {
      navigate("/", {
        replace: true,
        state: { invalidMsg: "The uploaded file is not a valid X12 837 EDI file. Please upload a valid 837 EDI file." },
      });
      return;
    }
    navigate("/view", { state: { data } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header darkMode={darkMode} onToggle={onToggle} />
      <main className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] w-full px-4 gap-4 pb-10">
        {/* ── Prototype Warning ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            backgroundColor: "#fff8e1",
            border: "1px solid #ffc107",
            borderLeft: "5px solid #e65100",
            borderRadius: "10px",
            padding: "14px 18px",
            maxWidth: "448px",
            width: "100%",
            boxShadow: "0 2px 8px rgba(230,81,0,0.10)",
            marginTop: "20px",
          }}
        >
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#7a3b00", marginBottom: "4px" }}>
              Prototype Notice
            </p>
            <ul style={{ fontSize: "0.85rem", color: "#5a3000", lineHeight: 1.7, marginLeft: "16px", listStyleType: "disc" }}>
              <li>Only <strong>one file</strong> per upload — batch uploads not supported</li>
              <li><strong>ZIP</strong> files are not supported; upload a plain <code>.edi</code> file</li>
              <li>Only <strong>X12 837</strong> (Healthcare Claim) EDI type is supported</li>
            </ul>
          </div>
        </div>

        {invalidMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              backgroundColor: "#fef2f2",
              border: "1px solid #f87171",
              borderLeft: "5px solid #dc2626",
              borderRadius: "8px",
              padding: "12px 16px",
              maxWidth: "448px",
              width: "100%",
            }}
          >
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>❌</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "#991b1b", marginBottom: "2px" }}>
                Invalid File
              </p>
              <p style={{ fontSize: "0.85rem", color: "#7f1d1d" }}>{invalidMsg}</p>
            </div>
          </div>
        )}
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
