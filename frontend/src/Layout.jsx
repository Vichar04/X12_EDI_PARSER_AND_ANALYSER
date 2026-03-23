import { Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";

const Layout = ({ darkMode, onToggle }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header darkMode={darkMode} onToggle={onToggle} />

      <main className="flex-grow px-4">
        <Outlet />
      </main>

      <Footer darkMode={darkMode} />
    </div>
  );
};

export default Layout;