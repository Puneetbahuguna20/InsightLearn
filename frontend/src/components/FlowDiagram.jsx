import React, { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { Search, Target, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

// Custom Node Types
const StepNode = ({ data }) => (
  <div className={`px-8 py-6 rounded-[2rem] border-4 shadow-2xl min-w-[320px] text-center cursor-pointer transition-all ${
    data.isActive 
      ? 'bg-amber-100 border-amber-500 scale-105 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.5)]' 
      : 'bg-white border-slate-100 hover:border-amber-300'
  }`}>
    <div className="flex items-center justify-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg ${
        data.isActive ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
      }`}>
        {data.stepNumber}
      </div>
      <span className={`text-xs font-black uppercase tracking-[0.2em] ${
        data.isActive ? 'text-amber-700' : 'text-slate-400'
      }`}>Step {data.stepNumber}</span>
    </div>
    <div className={`text-xl font-black tracking-tight leading-tight ${data.isActive ? 'text-slate-900' : 'text-slate-700'}`}>
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-400 border-none shadow-md" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-amber-400 border-none shadow-md" />
  </div>
);

const ProcessNode = ({ data }) => (
  <div className={`px-8 py-6 rounded-[2rem] border-4 shadow-2xl min-w-[320px] text-center cursor-pointer transition-all ${
    data.isActive 
      ? 'bg-amber-100 border-amber-500 scale-105 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.5)]' 
      : 'bg-white border-slate-100 hover:border-amber-300'
  }`}>
    <div className="flex items-center justify-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-lg ${
        data.isActive ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
      }`}>
        {data.stepNumber}
      </div>
      <span className={`text-xs font-black uppercase tracking-[0.2em] ${
        data.isActive ? 'text-amber-700' : 'text-slate-400'
      }`}>Step {data.stepNumber}</span>
    </div>
    <div className={`text-xl font-black tracking-tight leading-tight ${data.isActive ? 'text-slate-900' : 'text-slate-700'}`}>
      {data.label}
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-400 border-none shadow-md" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-amber-400 border-none shadow-md" />
  </div>
);

const DecisionNode = ({ data }) => (
  <div className={`relative w-44 h-44 flex items-center justify-center group cursor-pointer transition-transform ${
    data.isActive ? 'scale-110' : ''
  }`}>
    <div className={`absolute inset-0 rotate-45 border-4 shadow-2xl rounded-2xl transition-all ${
      data.isActive
        ? 'bg-emerald-100 border-emerald-500 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)]'
        : 'bg-white border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-300'
    }`}></div>
    <div className="relative z-10 text-center px-4">
      <div className={`text-xs font-black leading-tight uppercase mb-2 tracking-widest ${
        data.isActive ? 'text-emerald-800' : 'text-slate-400'
      }`}>Decision</div>
      <div className={`text-lg font-black tracking-tight leading-tight ${data.isActive ? 'text-slate-900' : 'text-slate-700'}`}>
        {data.label}
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-emerald-400 border-none !-top-2 shadow-md" />
    <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-emerald-400 border-none !-bottom-2 shadow-md" />
    <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 !bg-emerald-400 border-none !-right-2 shadow-md" />
    <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 !bg-emerald-400 border-none !-left-2 shadow-md" />
  </div>
);

const ResultNode = ({ data }) => (
  <div className={`px-10 py-8 rounded-[2.5rem] border-4 shadow-2xl min-w-[360px] text-center cursor-pointer transition-all ${
    data.isActive 
      ? 'bg-amber-100 border-amber-500 scale-105 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.5)]' 
      : 'bg-white border-slate-100 hover:border-amber-300'
  }`}>
    <div className="flex flex-col items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
        data.isActive ? 'bg-amber-600' : 'bg-amber-500'
      }`}>
        <CheckCircle2 className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className={`text-xs font-black uppercase tracking-[0.3em] mb-2 ${
          data.isActive ? 'text-amber-700' : 'text-slate-400'
        }`}>Final Outcome</div>
        <div className={`text-2xl font-black tracking-tighter leading-none ${data.isActive ? 'text-slate-900' : 'text-slate-700'}`}>
          {data.label}
        </div>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-400 border-none shadow-md" />
  </div>
);

const NodeTypes = {
  step: StepNode,
  process: ProcessNode,
  decision: DecisionNode,
  result: ResultNode,
};

const FlowContent = ({ nodes, edges, onNodeClick }) => {
  const { fitView } = useReactFlow();

  // Recenter and fit view whenever nodes change
  useEffect(() => {
    const timer = setTimeout(() => {
      // Use much smaller padding (0.1) so nodes appear larger
      fitView({ padding: 0.1, duration: 800, minZoom: 0.4, maxZoom: 1 });
    }, 100);
    return () => clearTimeout(timer);
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={NodeTypes}
      onNodeClick={(event, node) => onNodeClick(node.data)}
      fitView
      fitViewOptions={{ padding: 0.1, minZoom: 0.4, maxZoom: 1 }}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      zoomOnScroll={true}
      panOnScroll={true}
      zoomOnPinch={true}
      panOnDrag={true}
      zoomOnDoubleClick={true}
      minZoom={0.1}
      maxZoom={2}
    >
      <Background color="#cbd5e1" gap={40} variant="dots" opacity={0.4} />
      <Controls 
        showInteractive={false} 
        className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 shadow-2xl rounded-2xl overflow-hidden" 
      />
    </ReactFlow>
  );
};

// Layout Constants
const nodeWidth = 320; // Increased width for better text visibility
const nodeHeight = 140; // Increased height for better text visibility

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // TB = Top-to-Bottom
  dagreGraph.setGraph({ 
    rankdir: 'TB', 
    nodesep: 100, 
    ranksep: 180, 
    marginx: 100, 
    marginy: 100 
  });

  // Ensure every node is added to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // If NO edges are provided, create a vertical stack by linking nodes sequentially
  const finalEdges = [...edges];
  if (finalEdges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      finalEdges.push({
        id: `auto-e${nodes[i].id}-${nodes[i+1].id}`,
        source: nodes[i].id,
        target: nodes[i+1].id,
        label: 'Next',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 4, strokeDasharray: '10 10' }
      });
    }
  }

  // Add edges to the graph
  finalEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
      };
    }),
    edges: finalEdges
  };
};

const FlowDiagram = ({ data, onNodeClick, activeNodeId }) => {
  const { nodes: rawNodes = [], edges: rawEdges = [] } = data || {};

  const { nodes, edges } = useMemo(() => {
    const initialNodes = rawNodes.map((node, index) => ({
      id: node.id,
      type: node.type || (index === 0 ? 'step' : index === rawNodes.length - 1 ? 'result' : 'process'),
      data: { 
        id: node.id,
        label: node.label, 
        explanation: node.explanation, 
        example: node.example,
        stepNumber: node.stepNumber || (index + 1),
        isActive: activeNodeId === node.id
      },
      selected: activeNodeId === node.id
    }));

    const initialEdges = rawEdges.map((edge) => ({
      id: `e${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label || 'Next',
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#6366f1', 
        strokeWidth: 4,
        strokeDasharray: '10 10',
      },
      labelStyle: { 
        fill: '#6366f1', 
        fontWeight: 900, 
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      },
      labelBgPadding: [10, 6],
      labelBgBorderRadius: 8,
      labelBgStyle: { 
        fill: '#ffffff', 
        fillOpacity: 1, 
        stroke: '#e2e8f0', 
        strokeWidth: 2 
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
        width: 30,
        height: 30,
      },
    }));

    return getLayoutedElements(initialNodes, initialEdges);
  }, [rawNodes, rawEdges, activeNodeId]);

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900/50 relative group">
      <div className="absolute top-8 left-8 z-10 flex items-center gap-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-2xl">
        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none mb-1">Interactive</span>
          <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider leading-none">Logic Flow</span>
        </div>
      </div>

      <ReactFlowProvider>
        <FlowContent nodes={nodes} edges={edges} onNodeClick={onNodeClick} />
      </ReactFlowProvider>
    </div>
  );
};

export default FlowDiagram;
