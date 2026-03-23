import React from "react";
import { Link } from "react-router-dom";
import { FileCode2 } from "lucide-react";
const Footer = ({ darkMode }) => {
  return (
    <footer
      className={`mt-16 border-t ${
        darkMode
          ? "bg-background border-code text-gray-400"
          : "bg-gray-50 border-gray-200 text-gray-600"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
        
        {/* Left Section */}
        <div className="text-center md:text-left">
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
        </div>

        {/* Middle Section */}
        <div className="flex gap-6 text-sm">
          <Link
            to="/"
            className="hover:text-foreground transition-colors"
          >
            Upload
          </Link>
          <Link
            to="/docs"
            className="hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <Link
            to="/about"
            className="hover:text-foreground transition-colors"
          >
            About
          </Link>
        </div>

        {/* Right Section */}
        <div className="text-center md:text-right text-xs">
          <p>© {new Date().getFullYear()} EDI Parser</p>
          <p className="mt-1">
            Built for Healthcare Data Processing
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;