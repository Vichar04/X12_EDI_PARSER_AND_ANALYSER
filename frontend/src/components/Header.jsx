import React from "react";
import { Sun, Moon, FileCode2 } from "lucide-react";
import { Link } from "react-router-dom";

const Header = ({ darkMode, onToggle }) => {
  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">

        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-md">
            <FileCode2 size={20} />
          </div>  
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight text-foreground">
              EDI Parser
            </span>
            <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              X12 Analyser
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Upload
          </Link>
          <Link to="/docs" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link to="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>

        {/* Dark / Light toggle */}
        <button
          onClick={onToggle}
          aria-label="Toggle dark mode"
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-muted hover:bg-accent transition-all duration-200 shadow-sm"
        >
          {darkMode ? (
            <Sun size={17} className="text-yellow-400" />
          ) : (
            <Moon size={17} className="text-indigo-500" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
