"use client";

import { useState, FC, useCallback } from "react";
import { motion } from "framer-motion";
import { buttonAnim, highlightContainerAnim, highlightAnim, labelAnim } from "./Button.anim";
import Sparkles from "./components/Sparkles";
import Stars from "./components/Stars";
import { ButtonProps } from "./Button.d";
import S from "./Button.module.css";
import { useReactFlow, useEdges } from "reactflow";
import { useWorkflowExecution } from "@/hooks/use-workflow-execution";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

const AIButton: FC<ButtonProps> = ({
  children = "Generate",
  hueValue = 0,
  ...rest
}: ButtonProps) => {
  const [hover, setHover] = useState<boolean>(false);
  const [sparkles] = useState<number[]>(Array(30).fill(0));
  const { getNodes, setNodes } = useReactFlow();
  const edges = useEdges();
  const { isExecuting, error, progress, executeWorkflow, resetExecution } =
    useWorkflowExecution();
  const [showDialog, setShowDialog] = useState(false);

  const handleGenerateClick = useCallback(async () => {
    setShowDialog(true);

    try {
      // Get nodes and edges directly from ReactFlow
      const reactFlowNodes = getNodes();
      const nodes = reactFlowNodes && reactFlowNodes.length > 0 ? reactFlowNodes : [];

      if (nodes.length === 0) {
        console.warn("No nodes available for execution");
        return;
      }

      console.log("Starting workflow with nodes:", nodes);
      console.log("Edges:", edges);

      const result = await executeWorkflow(nodes as any, edges as any);
      console.log("Workflow result:", result);
      
      // Update the Output node with the result
      if (result) {
        const outputNode = nodes.find((n: any) => n.type === "outputNode");
        console.log("Output node found:", outputNode);
        if (outputNode) {
          console.log("Updating output node with result:", result);
          // Detect if result is an image URL or data URL
          const isImage = 
            result.startsWith('data:image/') || 
            result.startsWith('http://') || 
            result.startsWith('https://') ||
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(result);
          
          // Update in ReactFlow
          setNodes((nds: any) =>
            nds.map((node: any) => {
              if (node.id === outputNode.id) {
                console.log("Node updated in ReactFlow");
                return {
                  ...node,
                  data: { 
                    ...node.data, 
                    output: result, 
                    outputType: isImage ? "image" : "text" 
                  },
                };
              }
              return node;
            })
          );
        }
      } else {
        console.log("No result returned from workflow");
      }
    } catch (err) {
      console.error("Error in handleGenerateClick:", err);
    }
  }, [getNodes, setNodes, executeWorkflow, edges]);

  const handleDialogClose = () => {
    if (!isExecuting) {
      setShowDialog(false);
      resetExecution();
    }
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        <Sparkles sparkles={sparkles} hover={hover} />
        <motion.button
          {...rest}
          variants={buttonAnim}
          initial="init"
          animate={hover ? "anim" : "init"}
          whileTap="tap"
          onHoverStart={() => setHover(true)}
          onHoverEnd={() => setHover(false)}
          onClick={handleGenerateClick}
          disabled={isExecuting}
          className={S.btn}
          type="button"
          style={{
            filter: `hue-rotate(${hueValue}deg)`,
            opacity: isExecuting ? 0.7 : 1,
          }}
        >
          <motion.div
            data-testid="highlight"
            variants={highlightContainerAnim}
            className={S.highlightContainer}
            animate={hover ? "anim" : "init"}
          >
            <motion.div variants={highlightAnim} className={S.highlight}></motion.div>
          </motion.div>
          <Stars hover={hover} />
          <motion.span variants={labelAnim}>
            {isExecuting ? "Generating..." : children}
          </motion.span>
        </motion.button>
      </div>

      {/* Execution Dialog */}
      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Workflow Execution</DialogTitle>
            <DialogDescription>
              Processing your AI workflow
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Status */}
            <div className="flex items-start gap-3">
              {isExecuting && (
                <Loader className="h-5 w-5 animate-spin text-blue-500 mt-1" />
              )}
              {!isExecuting && !error && (
                <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
              )}
              {error && <AlertCircle className="h-5 w-5 text-red-500 mt-1" />}

              <div className="flex-1">
                <p
                  className={cn(
                    "font-medium",
                    error && "text-red-500",
                    !isExecuting && !error && "text-green-600"
                  )}
                >
                  {progress || "Initializing..."}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {isExecuting && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="bg-blue-500 h-2 rounded-full"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {!isExecuting && !error && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✓ Workflow completed successfully!
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={handleDialogClose}
              disabled={isExecuting}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-md text-sm font-medium transition"
            >
              {isExecuting ? "Processing..." : "Close"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIButton;
