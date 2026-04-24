import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Brain,
  Sparkles,
  Loader2,
  ChevronRight,
  Info,
  CheckCircle2,
  Zap,
  Layers,
  Activity,
  ArrowRight,
  Code,
  Lightbulb,
  Terminal
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../components/ui';
import TopicInput from '../components/TopicInput';
import LanguageSelector from '../components/LanguageSelector';
import FlowDiagram from '../components/FlowDiagram';
import { useInsightStore } from '../stores/insightStore';
import api from '../services/api';

// --- Sub-components for the new UI ---

const VisualRepresentation = ({ type, data, highlight, activeAction }) => {
  // Parse active action to determine what to highlight
  // Format: "highlight_index:3" or "highlight_component:Piston"
  const highlightInfo = useMemo(() => {
    if (!activeAction) return null;
    const [type, value] = activeAction.split(':');
    return { type, value };
  }, [activeAction]);

  if (type === 'algorithm') {
    return (
      <div className="flex flex-wrap gap-3 justify-center items-center py-8">
        {data.map((item, idx) => {
          const isHighlighted = highlightInfo?.type === 'highlight_index' && parseInt(highlightInfo.value) === idx;
          return (
            <motion.div
              key={idx}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: isHighlighted ? 1.1 : 1, 
                opacity: 1,
                backgroundColor: isHighlighted ? '#4f46e5' : '#f8fafc',
                color: isHighlighted ? '#ffffff' : '#1e293b',
                borderColor: isHighlighted ? '#4338ca' : '#e2e8f0'
              }}
              className={`w-14 h-14 flex items-center justify-center rounded-xl border-2 font-bold text-lg shadow-sm transition-colors`}
            >
              {item}
            </motion.div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center py-6">
      {data.map((item, idx) => {
        const isHighlighted = highlightInfo?.type === 'highlight_component' && highlightInfo.value === item;
        return (
          <motion.div
            key={idx}
            animate={{ 
              scale: isHighlighted ? 1.05 : 1,
              backgroundColor: isHighlighted ? '#dcfce7' : '#f1f5f9',
              borderColor: isHighlighted ? '#22c55e' : '#cbd5e1',
              color: isHighlighted ? '#166534' : '#475569'
            }}
            className="px-6 py-3 rounded-2xl border-2 font-bold shadow-sm"
          >
            {item}
          </motion.div>
        );
      })}
    </div>
  );
};

const StepCard = ({ step, isActive, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onClick(step)}
    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all duration-300 ${
      isActive 
        ? 'bg-indigo-50 border-indigo-500 shadow-md' 
        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'
    }`}
  >
    <div className="flex items-start gap-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
      }`}>
        {step.id}
      </div>
      <div className="space-y-1">
        <h4 className={`font-bold ${isActive ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
          {step.title}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {step.explanation}
        </p>
      </div>
    </div>
  </motion.div>
);

const ExampleSection = ({ example }) => {
  if (!example) return null;

  const isCode = example.type === 'code';

  return (
    <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-700 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-xl">
      <div className="flex items-center justify-between px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isCode ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
            {isCode ? <Code className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {isCode ? 'Practical Implementation' : 'Real-World Example'}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isCode ? `Language: ${example.language || 'Code'}` : 'Case Study'}
            </p>
          </div>
        </div>
        {isCode && (
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800">
            <Terminal className="w-3 h-3 text-indigo-600" />
            <span className="text-[10px] font-black text-indigo-600 uppercase">Executable</span>
          </div>
        )}
      </div>
      
      <div className="p-8 space-y-8">
        {/* Walkthrough Steps (New) */}
        {example.walkthrough && example.walkthrough.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Step-by-Step Walkthrough</h4>
              </div>
              {example.walkthrough.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-300 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Visual/Code Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  {isCode ? 'Code Implementation' : 'Context Details'}
                </h4>
              </div>
              {isCode ? (
                <div className="relative group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-5 blur transition duration-500"></div>
                  <pre className="relative p-6 bg-slate-950 rounded-xl overflow-x-auto custom-scrollbar border border-slate-800 shadow-2xl">
                    <code className="text-sm font-mono text-indigo-300 leading-relaxed">
                      {example.content}
                    </code>
                  </pre>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 italic text-slate-600 dark:text-slate-400 font-medium">
                  {example.content}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fallback for when no walkthrough exists */}
        {(!example.walkthrough || example.walkthrough.length === 0) && (
          <div>
            {isCode ? (
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-5 blur transition duration-500"></div>
                <pre className="relative p-6 bg-slate-950 rounded-xl overflow-x-auto custom-scrollbar border border-slate-800 shadow-2xl">
                  <code className="text-sm font-mono text-indigo-300 leading-relaxed">
                    {example.content}
                  </code>
                </pre>
              </div>
            ) : (
              <div className="flex gap-6 items-start">
                <div className="hidden md:flex flex-shrink-0 w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl items-center justify-center border border-amber-100 dark:border-amber-800">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-lg font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {example.content}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// --- Main Page Component ---

export const LearnPage = () => {
  const { language, setIsProcessing, isProcessing, triggerHistoryRefresh } = useInsightStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [aiResult, setAiResult] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [activeSection, setActiveSection] = useState('flow');

  const handleTopicSubmit = async (query) => {
    setSearchParams({ topic: query });
    setIsProcessing(true);
    setAiResult(null);
    setActiveStep(null);
    setActiveNode(null);

    // 1. IMMEDIATELY save the search query to history so "Recents" updates right away
    try {
      await api.post('/search/history', { 
        query: query,
        topic: query, // Initially use the query as the topic
        category: 'general'
      });
      // Trigger Sidebar to refresh its history list immediately
      triggerHistoryRefresh();
    } catch (historyError) {
      console.warn('Initial history save failed:', historyError);
    }
    
    try {
      const response = await api.post('/learn/query', { query, language });
      if (response.data.success) {
        const data = response.data.data;
        setAiResult(data);
        setActiveSection('flow'); // Reset to flow diagram on new search
        // Set first step as active by default
        if (data.steps && data.steps.length > 0) {
          setActiveStep(data.steps[0]);
        }

        // 2. UPDATE search history with the better AI-generated topic title
        try {
          await api.post('/search/history', { 
            query: query,
            topic: data.title,
            category: data.type || 'general'
          });
          // Trigger Sidebar again to show the better title
          triggerHistoryRefresh();
        } catch (historyError) {
          console.warn('Failed to update search history with AI title:', historyError);
        }
      }
    } catch (error) {
      console.error('AI Query Error:', error);
      toast.error("Failed to generate learning content.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle URL param on load
  useEffect(() => {
    const topic = searchParams.get('topic');
    // Reload only if the topic parameter exists AND it's different from the currently displayed topic
    if (topic && (!aiResult || aiResult.query !== topic)) {
      handleTopicSubmit(topic);
    }
  }, [searchParams, aiResult?.query]);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Top Search Section */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Interactive Learning
              </h1>
            </div>
            <LanguageSelector showLabel={false} />
          </div>
          <TopicInput onSubmit={handleTopicSubmit} />
        </section>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <Zap className="w-8 h-8 text-amber-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 animate-pulse">
              Synthesizing Structured Logic...
            </p>
          </div>
        )}

        {aiResult && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Title & Introduction */}
            <div className="text-center space-y-4">
              <Badge variant="outline" className="px-4 py-1 text-xs font-black uppercase tracking-[0.2em] border-indigo-200 text-indigo-600">
                {aiResult.type || 'Concept'} Detected
              </Badge>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {aiResult.title}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
                {aiResult.introduction}
              </p>
            </div>

            {/* Visual Representation Area (Only if visual data exists) */}
            {aiResult.visual?.data && (
              <Card className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-2 border-slate-200 dark:border-slate-700 rounded-[2.5rem]">
                <div className="flex items-center gap-2 mb-6 justify-center">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Live Visual State</h3>
                </div>
                <VisualRepresentation 
                  type={aiResult.type} 
                  data={aiResult.visual.data} 
                  activeAction={activeStep?.action || activeNode?.action}
                />
                
                {aiResult.formula?.expression && (
                  <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Active Formula</div>
                    <code className="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {aiResult.formula.expression}
                    </code>
                  </div>
                )}
              </Card>
            )}

            {/* Main Interactive Grid (3 Columns) */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Column 1: Steps (3/12) */}
              <div className="lg:col-span-3 space-y-6 z-10">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Steps</h3>
                </div>
                <div className="space-y-4 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar">
                  {aiResult.steps?.map((step) => (
                    <StepCard 
                      key={step.id} 
                      step={step} 
                      isActive={activeStep?.id === step.id}
                      onClick={(s) => {
                        setActiveStep(s);
                        setActiveNode(null);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Column 2: Flowchart (6/12) */}
              <div className="lg:col-span-6 space-y-6 z-0">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Logic Flow</h3>
                </div>
                <div className="h-[850px] bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden relative">
                  {aiResult.flowchart && (
                    <FlowDiagram 
                      data={aiResult.flowchart} 
                      activeNodeId={activeNode?.id || (activeStep ? aiResult.flowchart.nodes?.find(n => 
                        (n.label?.toLowerCase() || '').includes(activeStep.title?.toLowerCase() || '') || 
                        (activeStep.title?.toLowerCase() || '').includes(n.label?.toLowerCase() || '')
                      )?.id : null)}
                      onNodeClick={(node) => {
                        setActiveNode(node);
                        const matchingStep = aiResult.steps?.find(s => 
                          (s.title?.toLowerCase() || '').includes(node.label?.toLowerCase() || '') || 
                          (node.label?.toLowerCase() || '').includes(s.title?.toLowerCase() || '')
                        );
                        if (matchingStep) setActiveStep(matchingStep);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Column 3: Active Explanation (3/12) - Sticky */}
              <div className="lg:col-span-3 sticky top-8 space-y-6 z-20">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Info className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Explanation</h3>
                </div>
                
                <AnimatePresence mode="wait">
                  {(activeStep || activeNode) ? (
                    <motion.div
                      key={activeStep?.id || activeNode?.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Card className="p-6 bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-2xl rounded-[2rem] relative overflow-hidden">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600 text-white text-[10px] px-2 py-0.5">
                              {activeStep ? `Step ${activeStep.id}` : 'Node'}
                            </Badge>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                            {activeStep?.title || activeNode?.label}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {activeStep?.explanation || activeNode?.explanation}
                          </p>
                          {activeStep?.action && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                              <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Visual Action</div>
                              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-xl">
                                <Activity className="w-3 h-3" />
                                <span>
                                  {activeStep.action.includes(':') 
                                    ? (activeStep.action.split(':')[1]?.replace(/_/g, ' ') || activeStep.action) 
                                    : activeStep.action.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem] text-center space-y-4 opacity-50">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                        <Activity className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select a step or node to begin</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Practical Example Section */}
            <ExampleSection example={aiResult.example} />

            {/* Final Result & Summary */}
            <div className="grid md:grid-cols-2 gap-8">
              {aiResult.result?.text && (
                <Card className="p-8 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 rounded-[2rem]">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-widest">Final Result</h3>
                  </div>
                  <p className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                    {aiResult.result.text}
                  </p>
                </Card>
              )}

              <Card className="p-8 bg-slate-900 text-white rounded-[2rem] shadow-2xl">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Executive Summary</h3>
                <p className="text-base font-medium leading-relaxed opacity-90">
                  {aiResult.summary}
                </p>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
