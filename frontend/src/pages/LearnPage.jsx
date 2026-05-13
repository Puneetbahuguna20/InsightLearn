import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
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
  Terminal,
  Play,
  X
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, Button, Badge } from '../components/ui';
import TopicInput from '../components/TopicInput';
import LanguageSelector from '../components/LanguageSelector';
import FlowDiagram from '../components/FlowDiagram';
import { useInsightStore } from '../stores/insightStore';
import { useTranslation } from '../i18n/LanguageContext';
import { useTranslationService } from '../i18n/TranslationService';
import api from '../services/api';

// --- Sub-components for the new UI ---

const VisualRepresentation = ({ type, data, highlight, activeAction, translatedData }) => {
  // Parse active action to determine what to highlight
  // Format: "highlight_index:3" or "highlight_component:Piston"
  const highlightInfo = useMemo(() => {
    if (!activeAction) return null;
    const [type, value] = activeAction.split(':');
    return { type, value };
  }, [activeAction]);

  // Use translated data if available, otherwise use original data
  const displayData = translatedData || data;

  if (type === 'algorithm') {
    return (
      <div className="flex flex-wrap gap-3 justify-center items-center py-8">
        {displayData.map((item, idx) => {
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
      {displayData.map((item, idx) => {
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

const StepCard = ({ step, isActive, onClick }) => {
  return (
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
};

const ExampleSection = ({ example }) => {
  const { t, language } = useTranslation();
  
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
              {isCode ? t('learn.example.implementation', 'Practical Implementation') : t('learn.example.real_world', 'Real-World Example')}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {isCode ? `${t('learn.example.language', 'Language')}: ${example.language || t('learn.example.code', 'Code')}` : t('learn.example.case_study', 'Case Study')}
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
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    {language === 'hi' ? 'चरण-दर-चरण मार्गदर्शन' : 'Step-by-Step Walkthrough'}
                  </h4>
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
                    {language === 'hi' ? (example.walkthrough?.[idx] || step) : step}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Visual/Code Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  {isCode ? (language === 'hi' ? 'कोड कार्यान्वयन' : 'Code Implementation') : (language === 'hi' ? 'संदर्भ विवरण' : 'Context Details')}
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
  const { t, language } = useTranslation();
  const { translateLearningContent, translateTexts } = useTranslationService();
  const [translatedVisualData, setTranslatedVisualData] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedIntroduction, setTranslatedIntroduction] = useState(null);
  const { setIsProcessing, isProcessing, triggerHistoryRefresh } = useInsightStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [aiResult, setAiResult] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [activeNode, setActiveNode] = useState(null);
  const [activeSection, setActiveSection] = useState('flow');
  const [stepVideos, setStepVideos] = useState({}); // { stepId: [videos] }
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  
  // Fetch videos when active step changes
  useEffect(() => {
    const fetchVideos = async () => {
      if (!activeStep || !aiResult?.title || stepVideos[activeStep.id]) return;
      
      setIsLoadingVideos(true);
      try {
        const searchQuery = `${aiResult.title} ${activeStep.title} explanation`;
        console.log('🔍 Fetching video for:', searchQuery);
        const response = await api.get(`/videos/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.data.success) {
          setStepVideos(prev => ({
            ...prev,
            [activeStep.id]: response.data.videos
          }));
        }
      } catch (error) {
        console.warn('Failed to fetch videos:', error);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [activeStep?.id, aiResult?.title]);
  
  // Debounce state updates to prevent browser blocking
  const updateStateWithDelay = (setter, value, delay = 100) => {
    setTimeout(() => setter(value), delay);
  };

  const handleTopicSubmit = async (query) => {
    console.log('🔍 Starting handleTopicSubmit with query:', query);
    console.log('🔍 Current language:', language);
    setSearchParams({ topic: query });
    setIsProcessing(true);
    setAiResult(null);
    setActiveStep(null);
    setActiveNode(null);
    setStepVideos({}); // Clear previous topic's videos
    
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
        
        // Set original data immediately
        setAiResult(data);
        
        // Debug: Check complete data structure
        console.log('🔍 Complete data structure:', JSON.stringify(data, null, 2));
        
        // Debug: Check flowchart vs steps alignment
        console.log('🔍 Flowchart nodes count:', data.flowchart?.nodes?.length || 0);
        console.log('🔍 Steps count:', data.steps?.length || 0);
        console.log('🔍 Flowchart nodes:', data.flowchart?.nodes);
        console.log('🔍 Steps data:', data.steps);
        
        // Safe Hindi translations for key content
        console.log('🔍 Current language:', language);
        console.log('🔍 Language check - is Hindi?', language === 'hi');
        if (language === 'hi') {
          console.log('🔍 Hindi language detected - Starting translations');
          try {
            // Simple test translation first
            const testTranslation = await translateTexts(['Test']);
            console.log('🔍 Test translation result:', testTranslation);
            
            console.log('🔍 Starting Hindi translations for:', data);
            // Collect all translations first, then update once
            const translatedData = { ...data };
            
            // Translate title
            if (data.title) {
              console.log('🔍 Translating title:', data.title);
              const translatedTitle = await translateTexts([data.title]);
              translatedData.translatedTitle = translatedTitle[0];
              setTranslatedTitle(translatedTitle[0]);
              console.log('✅ Title translated:', translatedTitle[0]);
            }
            
            // Translate introduction
            if (data.introduction) {
              console.log('🔍 Translating introduction:', data.introduction);
              const translatedIntro = await translateTexts([data.introduction]);
              translatedData.translatedIntroduction = translatedIntro[0];
              setTranslatedIntroduction(translatedIntro[0]);
              console.log('✅ Introduction translated:', translatedIntro[0]);
            }
            
            // Translate flowchart nodes
            if (data.flowchart?.nodes) {
              console.log('🔍 Translating flowchart nodes:', data.flowchart.nodes.length);
              const translatedNodes = await Promise.all(
                data.flowchart.nodes.map(async (node) => {
                  const translatedNode = { ...node };
                  if (node.label) {
                    const translatedLabel = await translateTexts([node.label]);
                    translatedNode.label = translatedLabel[0];
                  }
                  return translatedNode;
                })
              );
              translatedData.flowchart = { ...data.flowchart, nodes: translatedNodes };
              console.log('✅ Flowchart nodes translated');
            }
            
            // Translate examples walkthrough steps
            if (data.examples && Array.isArray(data.examples)) {
              console.log('🔍 Translating examples:', data.examples.length);
              const translatedExamples = await Promise.all(
                data.examples.map(async (example) => {
                  const translatedExample = { ...example };
                  
                  if (example.walkthrough && Array.isArray(example.walkthrough)) {
                    console.log('🔍 Translating walkthrough steps:', example.walkthrough);
                    const translatedWalkthrough = await translateTexts(example.walkthrough);
                    translatedExample.walkthrough = translatedWalkthrough;
                    console.log('✅ Walkthrough translated:', translatedWalkthrough);
                  }
                  
                  if (example.context) {
                    console.log('🔍 Translating context:', example.context);
                    const translatedContext = await translateTexts([example.context]);
                    translatedExample.context = translatedContext[0];
                    console.log('✅ Context translated:', translatedContext[0]);
                  }
                  
                  return translatedExample;
                })
              );
              translatedData.examples = translatedExamples;
              console.log('✅ All examples translated');
            }
            
            // Translate main steps content
            if (data.steps && Array.isArray(data.steps)) {
              console.log('🔍 Translating main steps:', data.steps.length);
              console.log('🔍 Step data before translation:', data.steps);
              const translatedSteps = await Promise.all(
                data.steps.map(async (step) => {
                  const translatedStep = { ...step };
                  
                  if (step.title) {
                    const translatedTitle = await translateTexts([step.title]);
                    translatedStep.title = translatedTitle[0];
                    console.log('🔍 Step title translated:', step.title, '→', translatedTitle[0]);
                  }
                  
                  if (step.content) {
                    const translatedContent = await translateTexts([step.content]);
                    translatedStep.content = translatedContent[0];
                    console.log('🔍 Step content translated:', step.content, '→', translatedContent[0]);
                  }
                  
                  if (step.explanation) {
                    const translatedExplanation = await translateTexts([step.explanation]);
                    translatedStep.explanation = translatedExplanation[0];
                    console.log('🔍 Step explanation translated:', step.explanation, '→', translatedExplanation[0]);
                  }
                  
                  return translatedStep;
                })
              );
              translatedData.steps = translatedSteps;
              console.log('✅ All main steps translated:', translatedSteps);
            }
            
            // Single unified update to maintain synchronization
            setAiResult(translatedData);
            console.log('✅ All translations applied in one update');
            
          } catch (translationError) {
            console.warn('❌ Some translations failed:', translationError);
          }
        }
        
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
  }, [searchParams]); // Remove aiResult?.query from dependencies to prevent infinite loop

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
          </div>
          <TopicInput onSubmit={handleTopicSubmit} />
        </section>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 pointer-events-none">
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
                {language === 'hi' ? 'अवधारणा पता चली' : (aiResult.type || 'Concept Detected')}
              </Badge>
              <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'hi' ? (translatedTitle || aiResult.title) : aiResult.title}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
                {language === 'hi' ? (translatedIntroduction || aiResult.introduction) : aiResult.introduction}
              </p>
            </div>

            {/* Visual Representation Area (Only if visual data exists) */}
            {aiResult.visual?.data && (
              <Card className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-2 border-slate-200 dark:border-slate-700 rounded-[2.5rem]">
                <div className="flex items-center gap-2 mb-6 justify-center">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('learn.flow.title')}</h3>
                </div>
                <VisualRepresentation 
                  type={aiResult.type} 
                  data={aiResult.visual.data} 
                  translatedData={translatedVisualData}
                  activeAction={activeStep?.action || activeNode?.action}
                />
                
                {aiResult.formula?.expression && (
                  <div className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">{t('learn.flow.description')}</div>
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
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('learn.steps.loading')}</h3>
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
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {language === 'hi' ? 'तार्किक प्रवाह' : 'Logic Flow'}
                  </h3>
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
                        console.log('🔍 Node clicked:', node);
                        console.log('🔍 Available steps:', aiResult.steps);
                        setActiveNode(node);
                        
                        // Try multiple matching strategies
                        let matchingStep = null;
                        
                        // Strategy 1: Direct label/title match
                        matchingStep = aiResult.steps?.find(s => 
                          (s.title?.toLowerCase() || '').includes(node.label?.toLowerCase() || '') || 
                          (node.label?.toLowerCase() || '').includes(s.title?.toLowerCase() || '')
                        );
                        
                        // Strategy 2: Match by position/ID if available
                        if (!matchingStep && node.id) {
                          matchingStep = aiResult.steps?.find(s => 
                            s.id === node.id || 
                            s.id === parseInt(node.id) ||
                            s.stepNumber === parseInt(node.id)
                          );
                        }
                        
                        // Strategy 3: Match by content similarity
                        if (!matchingStep && aiResult.steps?.length > 0) {
                          const nodeIndex = aiResult.flowchart?.nodes?.findIndex(n => n.id === node.id);
                          if (nodeIndex >= 0 && nodeIndex < aiResult.steps.length) {
                            matchingStep = aiResult.steps[nodeIndex];
                          }
                        }
                        
                        // Strategy 4: Fallback to first step
                        if (!matchingStep && aiResult.steps?.length > 0) {
                          matchingStep = aiResult.steps[0];
                        }
                        
                        console.log('🔍 Matching step found:', matchingStep);
                        if (matchingStep) {
                          setActiveStep(matchingStep);
                          console.log('✅ Active step set:', matchingStep);
                        } else {
                          console.log('❌ No matching step found for node:', node.label);
                        }
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
                  <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('learn.explanation.title')}</h3>
                </div>
                
                <AnimatePresence mode="wait">
                  {(activeStep || activeNode) ? (
                    <motion.div
                      key={activeStep?.id || activeNode?.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {console.log('🔍 Explanation display - activeStep:', activeStep)}
                      {console.log('🔍 Explanation display - activeNode:', activeNode)}
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
                            {console.log('🔍 Explanation content:', activeStep?.explanation || activeNode?.explanation)}
                            {activeStep?.explanation || activeNode?.explanation}
                          </p>

                          {/* Video Section for Active Step */}
                          {activeStep && (
                            <div className="pt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Play className="w-3 h-3 text-red-500 fill-red-500" />
                                  Related Video
                                </div>
                              </div>
                              
                              {isLoadingVideos && !stepVideos[activeStep.id] ? (
                                <div className="aspect-video bg-slate-100 dark:bg-slate-700/50 rounded-2xl animate-pulse flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                                </div>
                              ) : stepVideos[activeStep.id]?.length > 0 ? (
                                <>
                                  <div className="group relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-slate-900">
                                    <iframe
                                      width="100%"
                                      height="100%"
                                      src={`https://www.youtube.com/embed/${stepVideos[activeStep.id][0].id}?autoplay=0&rel=0`}
                                      title={stepVideos[activeStep.id][0].title}
                                      frameBorder="0"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="absolute inset-0 w-full h-full"
                                    ></iframe>
                                  </div>
                                  <a 
                                    href={`https://www.youtube.com/watch?v=${stepVideos[activeStep.id][0].id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[10px] text-indigo-600 font-bold hover:underline pt-1"
                                  >
                                    <Activity className="w-3 h-3" />
                                    Watch on YouTube
                                  </a>
                                </>
                              ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                                  <p className="text-[10px] font-bold text-slate-400">No related videos found</p>
                                </div>
                              )}
                            </div>
                          )}

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
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('learn.explanation.placeholder')}</p>
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
                    <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-widest">{t('learn.final.title', 'Final Result')}</h3>
                  </div>
                  <p className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                    {aiResult.result.text}
                  </p>
                </Card>
              )}

              <Card className="p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{t('learn.summary.title', 'Executive Summary')}</h3>
                <div className="text-base font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
                  {(() => {
                    const summary = aiResult.summary || aiResult.introduction || aiResult.description;
                    if (!summary || summary.trim() === '') {
                      return "This comprehensive lesson provides a structured breakdown of the topic, including key concepts, logical flows, and practical examples to ensure deep understanding.";
                    }
                    return summary;
                  })()}
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
