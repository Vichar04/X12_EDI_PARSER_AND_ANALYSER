import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlineCheckCircle, AiOutlineWarning, AiOutlineCloseCircle } from "react-icons/ai";

const Section = ({ title, children }) => (
  <div className="rounded-xl border border-border bg-card p-5 space-y-2">
    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
    {children}
  </div>
);

const Badge = ({ ok }) =>
  ok ? (
    <span className="inline-flex items-center gap-1 text-green-500 font-medium text-sm">
      <AiOutlineCheckCircle /> Valid
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-red-500 font-medium text-sm">
      <AiOutlineCloseCircle /> Invalid
    </span>
  );

const ViewPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const data = state?.data;

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No EDI data found. Please upload a file first.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { parseEDIJson, valid, errors = [], warnings = [] } = data;

  return (
    <div className="px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">EDI Analysis Result</h1>
            <p className="text-sm text-muted-foreground mt-1">Parsed output from your uploaded file</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition"
          >
            ← Upload Another
          </button>
        </div>

        {/* Validation status */}
        <Section title="Validation">
          <div className="flex items-center gap-3">
            <Badge ok={valid} />
            {errors.length === 0 && warnings.length === 0 && (
              <span className="text-sm text-muted-foreground">No issues found</span>
            )}
          </div>

          {errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {errors.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-red-500">
                  <AiOutlineCloseCircle className="mt-0.5 shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          )}

          {warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-yellow-500">
                  <AiOutlineWarning className="mt-0.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Raw parsed JSON */}
        <Section title="Parsed EDI Data">
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto max-h-[55vh] leading-relaxed">
            {JSON.stringify(parseEDIJson, null, 2)}
          </pre>
        </Section>

      </div>
    </div>
  );
};

export default ViewPage;
