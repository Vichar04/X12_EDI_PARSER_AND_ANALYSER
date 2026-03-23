import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AiOutlineCheckCircle,
  AiOutlineWarning,
  AiOutlineCloseCircle,
} from "react-icons/ai";
import Tree from "react-d3-tree";

const Section = ({ title, children, className = "" }) => (
  <div
    className={`rounded-xl border border-border bg-card p-5 space-y-2 ${className}`}
  >
    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
      {title}
    </h2>
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
    return null; // Skip null/undefined values
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return null; // Skip empty arrays
    }
    const children = data
      .map((item, index) => transformToTree(item, `${nodeName} [${index}]`))
      .filter((child) => child !== null); // Filter out null children
    if (children.length === 0) {
      return null; // Skip arrays with no valid children
    }
    return {
      name: nodeName,
      children,
    };
  }

  if (typeof data === "object") {
    const children = [];

    Object.entries(data).forEach(([key, value]) => {
      // Skip internal metadata
      if (key === "_meta") return;

      if (typeof value === "object" && value !== null) {
        // If it's a nested object/array, it becomes a child node
        const childNode = transformToTree(value, key);
        if (childNode !== null) {
          children.push(childNode);
        }
      } else {
        // Skip empty primitive values
        if (value === null || value === undefined || value === "") return;
        // Primitive values become leaf nodes formatted as properties
        children.push({
          name: `${key}: ${String(value)}`,
          attributes: {
            isPropertyNode: "true",
            propKey: key,
            propValue: String(value),
          },
        });
      }
    });

    if (children.length === 0) {
      return null; // Skip objects with no valid children
    }

    const node = { name: nodeName };
    if (children.length > 0) node.children = children;

    return node;
  }

  // Primitive fallback, but skip empty strings
  if (data === "") return null;
  return { name: String(nodeName), attributes: { Value: String(data) } };
};

// Helper to recursively find and sum all financial amount fields from the parsed EDI
const extractFinancials = (data) => {
  const totals = {};
  let totalClaims = 0;

  const traverse = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
      return;
    }
    if (typeof obj === "object") {
      Object.entries(obj).forEach(([key, value]) => {
        // Special case: counting individual claims
        if (key === "claimId" || key === "claimNumber") {
          totalClaims++;
        }

        if (typeof value === "object") {
          traverse(value);
        } else if (typeof value === "string" || typeof value === "number") {
          // Look for amount-related keywords in the JSON keys
          if (/(charge|paid|amount|balance|payment)/i.test(key)) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
              // Format key nicely, e.g. "totalCharge" -> "Total Charge"
              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())
                .trim();

              totals[label] = (totals[label] || 0) + num;
            }
          }
        }
      });
    }
  };

  traverse(data);
  return { totals, totalClaims };
};

const ViewPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const data = state?.data;

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">
          No EDI data found. Please upload a file first.
        </p>
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

  // Extract dynamic financial info from the parsed document
  const { totals: financialAmounts, totalClaims } =
    extractFinancials(parseEDIJson);
  const financialKeys = Object.keys(financialAmounts);

  const [activeTab, setActiveTab] = useState("validation");

  return (
    <div className="px-4 py-6 w-full h-[calc(100vh-64px)]">
      <div className="max-w-[98%] mx-auto h-full flex flex-col space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold">EDI Analysis Result</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Parsed output from your uploaded file
            </p>
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
            <Section title="Overview" className="shrink-0">
              {/* Tab Buttons */}
              <div className="flex space-x-6 border-b border-border mb-4">
                <button
                  onClick={() => setActiveTab("validation")}
                  className={`pb-2 -mb-[1px] text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === "validation" ? "border-b-2 border-primary text-primary" : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Validation
                </button>
                {(financialKeys.length > 0 || totalClaims > 0) && (
                  <button
                    onClick={() => setActiveTab("financial")}
                    className={`pb-2 -mb-[1px] text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === "financial" ? "border-b-2 border-primary text-primary" : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    Financials
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="min-h-[120px]">
                {activeTab === "validation" && (
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge ok={valid} />
                      {errors.length === 0 && warnings.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          No issues found
                        </span>
                      )}
                    </div>

                    {errors.length > 0 && (
                      <ul className="space-y-1">
                        {errors.map((e, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-red-500"
                          >
                            <AiOutlineCloseCircle className="mt-0.5 shrink-0" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    )}

                    {warnings.length > 0 && (
                      <ul className="space-y-1">
                        {warnings.map((w, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-yellow-500"
                          >
                            <AiOutlineWarning className="mt-0.5 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === "financial" &&
                  (financialKeys.length > 0 || totalClaims > 0) && (
                    <div className="grid grid-cols-2 gap-3">
                      {totalClaims > 0 && (
                        <div className="flex flex-col col-span-2 bg-slate-50 p-4 rounded-lg border-[1.5px] border-black items-center justify-center">
                          <span className="text-3xl font-black text-black">
                            {totalClaims}
                          </span>
                          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">
                            Total Claims
                          </span>
                        </div>
                      )}
                      {financialKeys.map((key) => (
                        <div
                          key={key}
                          className="flex flex-col bg-white p-2.5 rounded border border-slate-200 shadow-sm col-span-1 overflow-hidden"
                        >
                          <span
                            className="text-[9px] text-slate-500 uppercase tracking-wider font-bold truncate mb-1"
                            title={key}
                          >
                            {key}
                          </span>
                          <span className="text-sm font-black text-black truncate">
                            $
                            {financialAmounts[key].toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </Section>

            <Section
              title="Parsed EDI Data (Raw)"
              className="flex-1 flex flex-col min-h-0"
            >
              <pre className="text-xs bg-muted rounded-lg p-4 overflow-auto flex-1 leading-relaxed">
                {JSON.stringify(parseEDIJson, null, 2)}
              </pre>
            </Section>
          </div>

          {/* Right Column: D3 Tree */}
          <div className="w-full lg:w-2/3 h-full pb-4">
            <Section
              title="EDI Tree Visualisation"
              className="h-full flex flex-col bg-black"
            >
              {/* Tree container background changed to white/slate-50 for a clean look */}
              <div
                className="flex-1 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200 relative text-black"
                style={{ minHeight: "500px" }}
              >
                <Tree
                  data={treeData}
                  orientation="horizontal"
                  translate={{ x: 50, y: 300 }}
                  nodeSize={{ x: 380, y: 120 }}
                  depthFactor={380}
                  pathClassFunc={() => "stroke-slate-300"}
                  pathFunc={(linkData) => {
                    const { source, target } = linkData;
                    // Start line from the right edge of parent box (x + boxWidth)
                    const sX = source.y + 250;
                    const sY = source.x;
                    // End line at the left edge of child (x)
                    const tX = target.y;
                    const tY = target.x;

                    return `M${sX},${sY}C${(sX + tX) / 2},${sY} ${(sX + tX) / 2},${tY} ${tX},${tY}`;
                  }}
                  renderCustomNodeElement={(rd3tProps) => {
                    const { nodeDatum, toggleNode } = rd3tProps;

                    const hasChildren =
                      (nodeDatum.children && nodeDatum.children.length > 0) ||
                      (nodeDatum._children && nodeDatum._children.length > 0);
                    const isExpanded =
                      nodeDatum.children && nodeDatum.children.length > 0;

                    const isProperty =
                      nodeDatum.attributes &&
                      nodeDatum.attributes.isPropertyNode === "true";

                    const boxWidth = 250;

                    return (
                      <g
                        onClick={toggleNode}
                        className="cursor-pointer transition-all hover:opacity-80"
                        onMouseEnter={(e) => {
                          const wrapper = e.currentTarget.parentNode;
                          if (wrapper && wrapper.parentNode) {
                            wrapper.parentNode.appendChild(wrapper);
                          }
                        }}
                      >
                        {/* Left connecting dot (incoming line arrives here) */}
                        <circle r="6" fill="#000000" />

                        {/* Right connecting dot (outgoing line starts here) */}
                        {hasChildren && (
                          <circle r="4" fill="#000000" cx={boxWidth} cy="0" />
                        )}

                        {/* Node Card - Using foreignObject to allow actual HTML/Tailwind text wrapping */}
                        <foreignObject
                          x="12"
                          y="-18"
                          width={boxWidth - 12}
                          height="500"
                          style={{ pointerEvents: "none", overflow: "visible" }}
                        >
                          <div
                            className={`border-[1.5px] rounded-lg shadow-sm p-2 px-3 flex flex-col group hover:shadow-md hover:z-50 relative transition-colors ${
                              isProperty
                                ? "bg-amber-50/90 border-amber-400"
                                : "bg-white border-black"
                            }`}
                            style={{ pointerEvents: "auto" }}
                          >
                            {isProperty ? (
                              <span
                                className="text-[13px] leading-tight break-words"
                                title={nodeDatum.name}
                              >
                                <span className="font-bold text-amber-900">
                                  {nodeDatum.attributes.propKey}:
                                </span>{" "}
                                <span className="font-mono text-slate-800 font-semibold">
                                  {nodeDatum.attributes.propValue}
                                </span>
                              </span>
                            ) : (
                              <span
                                className="text-black font-semibold text-[13px] leading-tight break-words"
                                title={nodeDatum.name}
                              >
                                {nodeDatum.name}
                              </span>
                            )}

                            {nodeDatum.attributes && !isProperty && (
                              <div className="hidden group-hover:flex flex-col gap-0.5 border-t border-slate-200 mt-1.5 pt-1.5">
                                {Object.entries(nodeDatum.attributes).map(
                                  ([k, v]) => (
                                    <span
                                      key={k}
                                      className="text-slate-600 font-mono text-[10px] leading-tight break-all"
                                    >
                                      <span className="font-bold text-slate-800">
                                        {k}:
                                      </span>{" "}
                                      {v}
                                    </span>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </foreignObject>

                        {/* Children count badge when collapsed */}
                        {hasChildren && !isExpanded && (
                          <g transform={`translate(${boxWidth - 10}, -15)`}>
                            <circle
                              cx="10"
                              cy="10"
                              r="12"
                              fill="#000000"
                              style={{
                                filter:
                                  "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                              }}
                            />
                            <text
                              x="10"
                              y="14"
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {nodeDatum._children.length}
                            </text>
                          </g>
                        )}
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
