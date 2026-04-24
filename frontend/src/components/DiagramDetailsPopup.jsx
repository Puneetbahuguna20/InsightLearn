import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Settings, Wrench, AlertTriangle, Link2, ChevronRight } from 'lucide-react';

const DiagramDetailsPopup = ({ component, isOpen, onClose }) => {
  if (!isOpen || !component) return null;

  const { details, label, type } = component;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'issues', label: 'Troubleshooting', icon: AlertTriangle },
  ];

  const [activeTab, setActiveTab] = React.useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {details?.description || `${label} is a critical component that plays an essential role in the system operation.`}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Function</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {details?.function || `Primary function is to facilitate efficient operation and maintain system integrity.`}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Working Principle</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {details?.working || `Operates through coordinated mechanical and physical processes, responding to input signals and producing desired outputs.`}
              </p>
            </div>
          </div>
        );

      case 'specs':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Materials</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {details?.specifications?.materials?.join(', ') || 'High-grade steel, Aluminum alloy'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Dimensions</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {details?.specifications?.dimensions || 'Standard industry specs'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Weight</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {details?.specifications?.weight || 'Variable based on application'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">Lifespan</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                  {details?.specifications?.lifespan || '50,000+ operating hours'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Maintenance Tasks</h4>
            <ul className="space-y-2">
              {(details?.maintenance || [
                'Regular inspection for wear and tear',
                'Lubrication as per schedule',
                'Alignment checks',
                'Performance monitoring'
              ]).map((task, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{task}</span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'issues':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Common Issues</h4>
            <div className="space-y-3">
              {(details?.troubleshooting || [
                { issue: 'Unusual noise', solution: 'Check for loose fittings and lubrication' },
                { issue: 'Reduced performance', solution: 'Inspect for wear and clean components' },
                { issue: 'Overheating', solution: 'Verify cooling system and reduce load' }
              ]).map((item, index) => (
                <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{item.issue}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Solution: {item.solution}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: component.color + '20' }}
                >
                  <span className="text-2xl" style={{ color: component.color }}>
                    {label.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{label}</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">{type} Component</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <Link2 className="w-4 h-4" />
                  <span>Related components:</span>
                </div>
                <button className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
                  View all connections
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(details?.relatedComponents || ['Primary support structures', 'Control mechanisms', 'Monitoring systems']).map((item, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DiagramDetailsPopup;
