import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AiOutlineCheckCircle, AiOutlineWarning, AiOutlineCloseCircle } from "react-icons/ai";
import Tree from "react-d3-tree";

const Section = ({ title, children, className = "" }) => (
  <div className={`rounded-xl border border-border bg-card p-5 space-y-2 ${className}`}>
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

// Helper to recursively transform the backend's structured JSON into react-d3-tree format
const transformToTree = (data, nodeName = "EDI Document") => {
  if (data === null || data === undefined) {
    return { name: String(data) };
  }
  
  if (Array.isArray(data)) {
    return {
      name: nodeName,
      children: data.map((item, index) => transformToTree(item, `${nodeName} [${index}]`))
    };
  } 
  
  if (typeof data === "object") {
    const children = [];
    const attributes = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Skip internal metadata
      if (key === "_meta") return;
      
      if (typeof value === "object" && value !== null) {
        // If it's a nested object/array, it becomes a child node
        children.push(transformToTree(value, key));
      } else {
        // Primitive values become attributes on the current node
        attributes[key] = String(value);
      }
    });

    const node = { name: nodeName };
    if (Object.keys(attributes).length > 0) node.attributes = attributes;
    if (children.length > 0) node.children = children;
    
    return node;
  }
  
  // Primitive fallback
  return { name: String(nodeName), attributes: { Value: String(data) } };
};

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
  const treeData = transformToTree(parseEDIJson);

  return (
    <div className="px-4 py-6 w-full h-[calc(100vh-64px)]">
      <div className="max-w-[98%] mx-auto h-full flex flex-col space-y-6">
        
        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0">
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

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start flex-1 min-h-0">
          
          {/* Left Column: Validation & Raw JSON */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 h-full">
            <Section title="Validation" className="shrink-0">
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

            <Section title="Parsed EDI Data (Raw)" className="flex-1 flex flex-col min-h-0">
              <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto flex-1 leading-relaxed">
                {JSON.stringify(parseEDIJson, null, 2)}
              </pre>
            </Section>
          </div>

          {/* Right Column: D3 Tree */}
          <div className="w-full lg:w-2/3 h-full pb-4">
            <Section title="EDI Tree Visualisation" className="h-full flex flex-col">
              <div className="flex-1 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700 relative text-black dark:text-white" style={{ minHeight: '500px' }}>
                <Tree 
                  data={treeData} 
                  orientation="horizontal"
                  translate={{ x: 50, y: 300 }}
                  nodeSize={{ x: 280, y: 60 }}
                  depthFactor={240}
                  renderCustomNodeElement={(rd3tProps) => {
                    const { nodeDatum, toggleNode } = rd3tProps;
                    
                    const hasChildren = (nodeDatum.children && nodeDatum.children.length > 0) || 
                                        (nodeDatum._children && nodeDatum._children.length > 0);
                    const isExpanded = nodeDatum.children && nodeDatum.children.length > 0;
                    
                    const boxWidth = 200;
                    const boxHeight = 44;
                    const maxTextLen = 22;
                    
                    const displayName = nodeDatum.name.length > maxTextLen 
                      ? nodeDatum.name.substring(0, maxTextLen - 3) + "..." 
                      : nodeDatum.name;

                    const attrsStr = nodeDatum.attributes 
                      ? Object.entries(nodeDatum.attributes).map(([k, v]) => `${k}:${v}`).join(' | ')
                      : '';
                    const displayAttrs = attrsStr.length > 30 
                      ? attrsStr.substring(0, 27) + "..." 
                      : attrsStr;

                    return (
                      <g onClick={toggleNode} className="cursor-pointer transition-all hover:opacity-80">
                        {/* Connecting dot */}
                        <circle 
                          r="5" 
                          fill={hasChildren ? (isExpanded ? "#3b82f6" : "#60a5fa") : "#10b981"} 
                        />
                        
                        <g transform={`translate(12, -${boxHeight / 2})`}>
                          {/* Pill background */}
                          <rect
                            width={boxWidth}
                            height={boxHeight}
                            rx="8"
                            fill={hasChildren ? "#1e293b" : "#0f172a"}
                            stroke={hasChildren ? (isExpanded ? "#3b82f6" : "#475569") : "#10b981"}
                            strokeWidth="1.5"
                            style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.4))" }}
                          />
                          
                          {/* Node Title */}
                          <text
                            fill="#f8fafc"
                            x="16"
                            y={boxHeight / 2 + (nodeDatum.attributes ? -4 : 4)}
                            fontSize="13"
                            fontWeight="600"
                            className="select-none"
                            title={nodeDatum.name}
                          >
                            {displayName}
                          </text>
                          
                          {/* Node Attributes */}
                          {nodeDatum.attributes && (
                            <text
                              fill="#94a3b8"
                              x="16"
                              y={boxHeight / 2 + 13}
                              fontSize="10"
                              fontFamily="monospace"
                              className="select-none"
                            >
                              {displayAttrs}
                            </text>
                          )}
                          
                          {/* Children count badge when collapsed */}
                          {hasChildren && !isExpanded && (
                            <g transform={`translate(${boxWidth - 24}, ${boxHeight / 2 - 10})`}>
                              <circle cx="10" cy="10" r="10" fill="#3b82f6" />
                              <text x="10" y="14" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                                {nodeDatum._children.length}
                              </text>
                            </g>
                          )}
                        </g>
                      </g>
                    );
                  }}
                />
              </div>
            </Section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ViewPage;
