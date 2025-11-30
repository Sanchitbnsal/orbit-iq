"use client";

import { memo, useRef, useEffect, useState } from "react";
import { Terminal, Copy, Download } from "lucide-react";
import { BaseNode } from "./base-node";
import { useReactFlow } from 'reactflow';
import Image from "next/image";
import { cn } from "@/lib/utils";

interface TableData {
  headers: string[];
  rows: string[][];
}

export const OutputNode = memo(({ data, id }: { data: any; id: string }) => {
  const { setNodes } = useReactFlow();
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Handle scroll position and max scroll
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setScrollPosition(contentRef.current.scrollTop);
        const max = contentRef.current.scrollHeight - contentRef.current.clientHeight;
        setMaxScroll(Math.max(0, max));
      }
    };

    const container = contentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Set initial max scroll
      const max = container.scrollHeight - container.clientHeight;
      setMaxScroll(Math.max(0, max));
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [data.output, data.outputType]);

  // Update max scroll on content changes
  useEffect(() => {
    if (contentRef.current && data.output && data.outputType !== 'image') {
      const max = contentRef.current.scrollHeight - contentRef.current.clientHeight;
      setMaxScroll(Math.max(0, max));
    }
  }, [data.output, data.outputType]);

  const updateNodeData = (newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScrollPosition = parseFloat(e.target.value);
    if (contentRef.current) {
      contentRef.current.scrollTop = newScrollPosition;
      setScrollPosition(newScrollPosition);
    }
  };

  const handleCopyToClipboard = () => {
    if (data.output && data.outputType !== 'image') {
      navigator.clipboard.writeText(data.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadOutput = () => {
    if (data.output) {
      const element = document.createElement('a');
      const file = new Blob([data.output], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = 'output.txt';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Parse markdown table
  const parseMarkdownTable = (text: string): { table: TableData | null; beforeTable: string; afterTable: string } => {
    const lines = text.split('\n');
    let tableStartIdx = -1;
    let tableEndIdx = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('|')) {
        if (tableStartIdx === -1) tableStartIdx = i;
        tableEndIdx = i;
      } else if (tableStartIdx !== -1) {
        break;
      }
    }

    if (tableStartIdx === -1) return { table: null, beforeTable: text, afterTable: '' };

    const beforeTable = lines.slice(0, tableStartIdx).join('\n');
    const afterTable = lines.slice(tableEndIdx + 1).join('\n');
    const tableLines = lines.slice(tableStartIdx, tableEndIdx + 1);

    // Parse table
    const headers = tableLines[0]
      .split('|')
      .map(h => h.trim())
      .filter(h => h);

    // Skip separator line (second line)
    const rows = tableLines.slice(2).map(line =>
      line.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell)
    );

    return {
      table: { headers, rows },
      beforeTable,
      afterTable
    };
  };

  // Format text lines
  const formatOutput = (text: string) => {
    if (!text) return [];
    
    const lines = text.split('\n');
    return lines.map((line) => {
      const leadingSpaces = line.match(/^\s*/)?.[0]?.length || 0;
      const indentLevel = Math.floor(leadingSpaces / 2);
      
      const isHeading = line.trim().match(/^#+\s|^\*\*.*\*\*:|^##|^###/);
      const isCodeBlock = line.trim().startsWith('```') || line.trim().startsWith('`');
      const isListItem = line.trim().match(/^[\*\-\+]\s|^\d+\.\s/);
      
      return {
        content: line,
        leadingSpaces,
        indentLevel,
        isHeading,
        isCodeBlock,
        isListItem,
      };
    });
  };

  const { table, beforeTable, afterTable } = parseMarkdownTable(data.output || '');
  const beforeLines = formatOutput(beforeTable);
  const afterLines = formatOutput(afterTable);

  return (
    <BaseNode
      data={data}
      icon={Terminal}
      label="Output"
      badgeText="Result"
      updateNodeData={updateNodeData}
      isOutput={true}
      hideBottomHandles={true}
      singleTarget={true}
      width="w-[500px]"
    >
      <div className="space-y-2 w-full">
        <p className="text-sm text-muted-foreground">{data.description}</p>
        
        <div className={cn(
          "mt-2 rounded-md border overflow-hidden flex flex-col transition-all duration-300",
          !data.output && "border-dashed h-64 w-64 justify-center items-center",
          data.output && data.outputType === 'image' && "w-full h-64 bg-slate-950 border-slate-700",
          data.output && data.outputType !== 'image' && "bg-slate-950 border-slate-700 w-full h-64"
        )}>
          {data.output ? (
            data.outputType === 'image' ? (
              <div className="relative w-full h-full">
                <Image
                  src={data.output}
                  alt="Generated output"
                  width={256}
                  height={256}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            ) : (
              <>
                {/* Output Content with Table Support */}
                <div 
                  ref={contentRef}
                  className="overflow-x-auto overflow-y-scroll p-2 bg-gradient-to-b from-slate-950 to-slate-900 scrollbar-hide"
                  style={{
                    height: '224px',
                    maxWidth: '100%',
                    flex: 'none'
                  }}
                >
                  <div className="font-mono text-xs leading-tight text-slate-100 whitespace-pre">
                    {/* Content before table */}
                    <div className="whitespace-pre-wrap break-words">
                      {beforeLines.map((line, idx) => (
                      <div
                        key={`after-${idx}`}
                        className={cn(
                          "py-0.5",
                          line.isHeading && "font-bold text-blue-300 my-1 text-xs",
                          line.isCodeBlock && "bg-slate-800 text-amber-200 px-2 rounded my-0.5",
                          line.isListItem && "text-green-300 ml-2",
                          line.content.trim() && "hover:bg-slate-800 hover:bg-opacity-30 px-1"
                        )}
                        style={{
                          marginLeft: `${Math.min(line.indentLevel * 0.5, 2)}rem`,
                        }}
                      >
                          {line.isListItem && (
                            <span className="text-slate-500 mr-2">•</span>
                          )}
                          {line.content || '\u00A0'}
                        </div>
                      ))}
                    </div>

                    {/* Markdown Table Rendered as HTML Table */}
                    {table && (
                      <div className="my-2 overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-600 text-xs">
                          <thead>
                            <tr className="bg-slate-800">
                              {table.headers.map((header, idx) => (
                                <th
                                  key={`header-${idx}`}
                                  className="border border-slate-600 px-2 py-1 text-left font-bold text-blue-300 whitespace-nowrap text-xs"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, rowIdx) => (
                              <tr
                                key={`row-${rowIdx}`}
                                className={rowIdx % 2 === 0 ? "bg-slate-900" : "bg-slate-800 bg-opacity-50"}
                              >
                                {row.map((cell, cellIdx) => (
                                  <td
                                    key={`cell-${rowIdx}-${cellIdx}`}
                                    className="border border-slate-600 px-2 py-1 text-slate-100 whitespace-pre-wrap break-words text-xs"
                                  >
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Content after table */}
                    <div className="whitespace-pre-wrap break-words">
                      {afterLines.map((line, idx) => (
                        <div
                          key={`after-${idx}`}
                          className={cn(
                            "py-0.5",
                            line.isHeading && "font-bold text-blue-300 my-2 text-sm",
                            line.isCodeBlock && "bg-slate-800 text-amber-200 px-2 rounded my-1",
                            line.isListItem && "text-green-300 ml-4",
                            line.content.trim() && "hover:bg-slate-800 hover:bg-opacity-30 px-2"
                          )}
                          style={{
                            marginLeft: `${Math.min(line.indentLevel * 1, 4)}rem`,
                          }}
                        >
                          {line.isListItem && (
                            <span className="text-slate-500 mr-2">•</span>
                          )}
                          {line.content || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-1 p-2 bg-slate-900 border-t border-slate-700">
                  {maxScroll > 0 && (
                    <div className="flex items-center gap-1 w-full">
                      <label className="text-xs text-slate-400 min-w-max">Scroll:</label>
                      <input
                        type="range"
                        min="0"
                        max={maxScroll}
                        value={scrollPosition}
                        onChange={handleSliderChange}
                        className="flex-1 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                      />
                      <span className="text-xs text-slate-400 min-w-max">
                        {maxScroll > 0 ? Math.round((scrollPosition / maxScroll) * 100) : 0}%
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyToClipboard}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 rounded transition"
                      title="Copy to clipboard"
                    >
                      <Copy size={14} />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownloadOutput}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 rounded transition"
                      title="Download output"
                    >
                      <Download size={14} />
                      Download
                    </button>
                  </div>
                </div>
              </>
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              Output will appear here
            </p>
          )}
        </div>
      </div>
    </BaseNode>
  );
});

OutputNode.displayName = "OutputNode";