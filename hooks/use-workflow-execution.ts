"use client";

import { useState, useCallback } from "react";
import { Node, Edge } from "reactflow";
import { processWorkflow } from "@/lib/gemini-service";
import { toast } from "sonner";

interface ExecutionState {
  isExecuting: boolean;
  error: string | null;
  progress: string;
  results: Record<string, string>;
}

export function useWorkflowExecution() {
  const [state, setState] = useState<ExecutionState>({
    isExecuting: false,
    error: null,
    progress: "",
    results: {},
  });

  const executeWorkflow = useCallback(
    async (nodes: Node[], edges: Edge[]) => {
      // Validation
      if (nodes.length === 0) {
        toast.error("No nodes in workflow");
        return null;
      }

      const outputNode = nodes.find((n) => n.type === "outputNode");
      if (!outputNode) {
        toast.error("Output node is required");
        return null;
      }

      setState({
        isExecuting: true,
        error: null,
        progress: "Starting workflow execution...",
        results: {},
      });

      try {
        // Check if workflow has any input nodes connected to output
        const outputInputEdges = edges.filter((e) => e.target === outputNode.id);
        if (outputInputEdges.length === 0) {
          throw new Error(
            "Output node must be connected to at least one other node"
          );
        }

        setState((prev: ExecutionState) => ({
          ...prev,
          progress: "Processing nodes...",
        }));

        const results = await processWorkflow(nodes, edges, outputNode.id);
        console.log("All results from workflow:", results);

        // Get the output from the output node
        const outputKey = outputNode.id;
        const outputResult = results[outputKey];
        console.log("Output result for output node:", outputResult);

        setState({
          isExecuting: false,
          error: null,
          progress: "Workflow execution completed!",
          results,
        });

        toast.success("Workflow executed successfully!");

        return outputResult || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setState({
          isExecuting: false,
          error: errorMessage,
          progress: `Error: ${errorMessage}`,
          results: {},
        });
        toast.error(errorMessage);
        console.error("Workflow execution error:", err);
        return null;
      }
    },
    []
  );

  const resetExecution = useCallback(() => {
    setState({
      isExecuting: false,
      error: null,
      progress: "",
      results: {},
    });
  }, []);

  return {
    ...state,
    executeWorkflow,
    resetExecution,
  };
}
