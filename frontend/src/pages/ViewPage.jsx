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
            <Section title="EDI Tree Visualisation" className="h-full flex flex-col bg-white">
              {/* Tree container background changed to white/slate-50 for a clean look */}
              <div className="flex-1 w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200 relative text-black" style={{ minHeight: '500px' }}>
                <Tree 
                  data={treeData} 
                  orientation="horizontal"
                  translate={{ x: 50, y: 300 }}
                  nodeSize={{ x: 380, y: 120 }}
                  depthFactor={380}
                  pathClassFunc={() => 'stroke-slate-300'}
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
                    
                    const hasChildren = (nodeDatum.children && nodeDatum.children.length > 0) || 
                                        (nodeDatum._children && nodeDatum._children.length > 0);
                    const isExpanded = nodeDatum.children && nodeDatum.children.length > 0;
                    
                    const boxWidth = 250;

                    return (
                      <g onClick={toggleNode} className="cursor-pointer transition-all hover:opacity-80">
                        {/* Left connecting dot (incoming line arrives here) */}
                        <circle r="6" fill="#000000" />
                        
                        {/* Right connecting dot (outgoing line starts here) */}
                        {hasChildren && (
                          <circle r="4" fill="#000000" cx={boxWidth} cy="0" />
                        )}

                        {/* Node Card - Using foreignObject to allow actual HTML/Tailwind text wrapping */}
                        <foreignObject x="12" y="-45" width={boxWidth - 12} height="150" style={{ pointerEvents: 'none' }}>
                          <div 
                            className="bg-white border-[1.5px] border-black rounded-lg shadow-sm p-3 flex flex-col"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <span className="text-black font-semibold text-[13px] leading-tight break-words mb-1" title={nodeDatum.name}>
                              {nodeDatum.name}
                            </span>
                            
                            {nodeDatum.attributes && (
                              <div className="flex flex-col gap-0.5 border-t border-slate-100 mt-0.5 pt-1.5">
                                {Object.entries(nodeDatum.attributes).map(([k, v]) => (
                                  <span key={k} className="text-slate-600 font-mono text-[10px] leading-tight break-all">
                                    <span className="font-bold text-slate-800">{k}:</span> {v}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </foreignObject>
                        
                        {/* Children count badge when collapsed */}
                        {hasChildren && !isExpanded && (
                          <g transform={`translate(${boxWidth - 10}, -15)`}>
                            <circle cx="10" cy="10" r="12" fill="#000000" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}/>
                            <text x="10" y="14" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
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
