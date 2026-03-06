import { create } from "zustand";
import { createsCycle } from "@/lib/dagValidation";
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

/* ===============================
   Initial Nodes
================================ */

const initialNodes: Node[] = [
  {
    id: "node-1",
    type: "textInput",
    position: { x: 50, y: 100 },
    data: {
      label: "Product Name",
      value: "Nitro Cold Brew",
    },
  },
  {
    id: "node-2",
    type: "geminiLLM",
    position: { x: 350, y: 100 },
    data: {
      label: "AI Copywriter",
      model: "models/gemini-2.5-flash",
    },
  },
];

const initialEdges: Edge[] = [];

/* ===============================
   Store Interface
================================ */

interface WorkflowState {
  past: Array<{ nodes: Node[]; edges: Edge[] }>;
  future: Array<{ nodes: Node[]; edges: Edge[] }>;
  undo: () => void;
  redo: () => void;
  nodes: Node[];
  edges: Edge[];
  isRunning: boolean;
  isLocked: boolean;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  addNode: (type: string, position: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, newData: any) => void;

  setIsRunning: (status: boolean) => void;
  setIsLocked: (locked: boolean) => void;
}

/* ===============================
   Zustand Store
================================ */

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // History stacks
  past: [],
  future: [],

  nodes: initialNodes,
  edges: initialEdges,
  isRunning: false,
  isLocked: false,

  /* -------------------------------
     Undo / Redo
  -------------------------------- */
  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[0];
    set({
      past: [...past, { nodes, edges }],
      future: future.slice(1),
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  /* -------------------------------
     Node Changes
  -------------------------------- */
  onNodesChange: (changes: NodeChange[]) => {
    const current = get();
    // Save current state before change
    const newNodes = applyNodeChanges(changes, current.nodes);
    set({
      past: [...current.past, { nodes: current.nodes, edges: current.edges }],
      future: [],
      nodes: newNodes,
    });
  },

  /* -------------------------------
     Edge Changes
  -------------------------------- */
  onEdgesChange: (changes: EdgeChange[]) => {
    const current = get();
    const newEdges = applyEdgeChanges(changes, current.edges);
    set({
      past: [...current.past, { nodes: current.nodes, edges: current.edges }],
      future: [],
      edges: newEdges,
    });
  },

  /* -------------------------------
     NODE + DAG VALIDATED CONNECT
  -------------------------------- */
  onConnect: (connection: Connection) => {
    console.log("Connection attempt:", connection);
    if (get().isLocked) return;
    if (!connection.source || !connection.target) return;

    const current = get();
    const { nodes, edges } = current;

    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) return;

    let isValid = false;

    /* ============================
       NODE TYPE VALIDATION RULES
    ============================ */

    // Text → LLM
    if (sourceNode.type === "textInput" && targetNode.type === "geminiLLM") {
      if (
        connection.targetHandle === "system" ||
        connection.targetHandle === "user"
      ) {
        isValid = true;
      }
    }

    // Image → LLM
    else if (
      sourceNode.type === "imageUpload" &&
      targetNode.type === "geminiLLM"
    ) {
      if (connection.targetHandle === "image") {
        isValid = true;
      }
    }

    // VIDEO → EXTRACT FRAME
    else if (
      sourceNode.type === "videoUpload" &&
      targetNode.type === "extractFrame"
    ) {
      if (connection.targetHandle === "video") {
        isValid = true;
      }
    }

    // EXTRACT FRAME → CROP
    else if (
      sourceNode.type === "extractFrame" &&
      targetNode.type === "cropImage"
    ) {
      isValid = true;
    }

    // EXTRACT FRAME → LLM
    else if (
      sourceNode.type === "extractFrame" &&
      targetNode.type === "geminiLLM"
    ) {
      if (connection.targetHandle === "image") {
        isValid = true;
      }
    }

    // IMAGE → CROP
    else if (
      sourceNode.type === "imageUpload" &&
      targetNode.type === "cropImage"
    ) {
      isValid = true;
    }

    // CROP → LLM
    else if (
      sourceNode.type === "cropImage" &&
      targetNode.type === "geminiLLM"
    ) {
      if (connection.targetHandle === "image") {
        isValid = true;
      }
    }

    // Text → Text
    else if (
      sourceNode.type === "textInput" &&
      targetNode.type === "textInput"
    ) {
      isValid = true;
    }

    // LLM → Text
    else if (
      sourceNode.type === "geminiLLM" &&
      targetNode.type === "textInput"
    ) {
      isValid = true;
    }

    if (!isValid) {
      alert("❌ Invalid connection between these node types.");
      return;
    }

    console.log(connection);
    /* ============================
       DAG VALIDATION
    ============================ */

    const willCreateCycle = createsCycle(
      nodes,
      edges,
      connection.source,
      connection.target
    );

    if (willCreateCycle) {
      alert("❌ Workflow cannot contain cycles.");
      return;
    }

    /* ============================
       ADD EDGE (with history)
    ============================ */
    const newEdges = addEdge(
      {
        ...connection,
        animated: true,
        style: {
          stroke: "#a855f7",
          strokeWidth: 2,
        },
      },
      edges
    );

    set({
      past: [...current.past, { nodes: current.nodes, edges: current.edges }],
      future: [],
      edges: newEdges,
    });
  },

  /* -------------------------------
     Setters
  -------------------------------- */
  setNodes: (nodes: Node[]) => {
    const current = get();
    set({
      past: [...current.past, { nodes: current.nodes, edges: current.edges }],
      future: [],
      nodes,
    });
  },

  setEdges: (edges: Edge[]) => {
    const current = get();
    set({
      past: [...current.past, { nodes: current.nodes, edges: current.edges }],
      future: [],
      edges,
    });
  },

  /* -------------------------------
     Add Node
  -------------------------------- */
  addNode: (type: string, position: { x: number; y: number }) => {
    const current = get();
    const id = `node-${Math.random().toString(36).slice(2, 9)}`;
    const newNode: Node = {
      id,
      type,
      position,
      data: {
        label: type,
        value: "",
      },
    };
    const newNodes = [...current.nodes, newNode];

    set({
      past: [...current.past, { nodes: current.nodes, edges: current.edges }],
      future: [],
      nodes: newNodes,
    });
  },

  /* -------------------------------
     Update Node Data
  -------------------------------- */
  updateNodeData: (nodeId: string, newData: any) => {
    const current = get();
    const newNodes = current.nodes.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...newData } }
        : node
    );

    set({
      past: [...current.past, { nodes: current.nodes, edges: current.edges }],
      future: [],
      nodes: newNodes,
    });
  },

  /* -------------------------------
     Running State
  -------------------------------- */
  setIsRunning: (status: boolean) =>
    set({ isRunning: status }),

  /* -------------------------------
     Lock State
  -------------------------------- */
  setIsLocked: (locked: boolean) =>
    set({ isLocked: locked }),
}));