import React, { useState } from "react";
import { AiOutlineCloudUpload, AiOutlineCheckCircle } from "react-icons/ai";
import { MdClear } from "react-icons/md";
import axios from "axios";

// ── Change this to your real API base URL ─────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────

const ALLOWED_EXTENSIONS = [".txt", ".edi", ".dat", ".x12", ".zip"];

const isFileAllowed = (file) => {
  const name = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
};

const DragNdrop = ({ onUploadSuccess, className = "" }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const selectFile = (f) => {
    if (!isFileAllowed(f)) {
      setError(`Invalid file type. Supported: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) selectFile(f);
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const ext = file.name.split('.').pop().toLowerCase();
    const endpointUrl = `${import.meta.env.VITE_BACKEND_API_BASE_URL}/${ext === 'zip' ? 'edi' : ext}`; // fallback for zip if needed, or just /ext

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(endpointUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploadSuccess?.(response.data);
    } catch (err) {
      const msg =
        err.response?.data?.error || err.message || "Upload failed. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <section className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-2xl p-6 transition-all duration-300
          ${file
            ? "border-green-500 bg-green-500/5"
            : "border-gray-600 hover:border-gray-400"
          }`}
      >
        {/* Drop zone */}
        <div className="flex flex-col items-center text-center gap-3">
          <AiOutlineCloudUpload className="text-4xl text-gray-400" />

          <div>
            <p className="text-lg font-medium">Drag &amp; drop a file here</p>
            <p className="text-sm text-gray-400">
              Supported: .txt, .edi, .x12, .zip &nbsp;·&nbsp; one file only
            </p>
          </div>

          <input
            type="file"
            hidden
            id="browse"
            onChange={handleFileChange}
            accept=".txt,.edi,.x12,.zip"
          />
          <label
            htmlFor="browse"
            className="mt-2 cursor-pointer px-4 py-2 rounded-lg bg-gray-800 text-white font-medium hover:bg-gray-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition"
          >
            Browse File
          </label>
        </div>

        {/* Selected file chip */}
        {file && (
          <div className="mt-5 flex items-center justify-between bg-muted rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <AiOutlineCheckCircle className="shrink-0 text-green-500" />
              <p className="text-sm truncate">{file.name}</p>
            </div>
            <MdClear
              className="shrink-0 ml-2 cursor-pointer text-gray-400 hover:text-red-500 transition"
              onClick={handleRemove}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-3 text-center text-sm text-red-500">{error}</p>
        )}

        {/* Upload button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-5 w-full py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Uploading…" : "Upload & Analyse"}
          </button>
        )}
      </div>
    </section>
  );
};

export default DragNdrop;