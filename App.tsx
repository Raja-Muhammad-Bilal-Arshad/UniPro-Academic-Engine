
import React, { useState, useEffect, useRef } from 'react';
import { Brain, Layout, BookOpen, Menu, X, GraduationCap, Wrench, ShieldAlert, FileSearch, Sparkles, RefreshCcw, Repeat, FileText, FileType } from 'lucide-react';
import { ModuleType, Message, FileAttachment, Role } from './types';
import { MODULE_DESCRIPTIONS } from './constants';
import { initializeChat, sendMessageStream } from './services/geminiService';
import { parseUniProResponse } from './utils/parser';
import { UniProWindows } from './components/UniProWindows';
import { ChatInput } from './components/ChatInput';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>(ModuleType.ASSIGNMENT);
  const [activeUtilityTool, setActiveUtilityTool] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize Chat on mount
  useEffect(() => {
    initializeChat().catch(err => console.error("Failed to init chat:", err));
  }, []);

  // Reset Utility tool when module changes
  useEffect(() => {
    if (activeModule !== ModuleType.UTILITIES) {
      setActiveUtilityTool(null);
    }
  }, [activeModule]);

  const handleSendMessage = async (text: string, attachment: FileAttachment | null) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    const aiMessagePlaceholder: Message = {
      id: aiMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isLoading: true,
      parsedContent: { theory: '', code: '', output: '' }
    };
    
    setMessages(prev => [...prev, aiMessagePlaceholder]);

    try {
      let promptToSend = text;
      
      // Context Injection
      if (messages.length === 0) {
        promptToSend = `[User selected module: ${activeModule}] ${text}`;
      } else if (activeModule === ModuleType.UTILITIES && activeUtilityTool) {
        // Explicit instruction for Utilities
        promptToSend = `[Sub-Mode: ${activeUtilityTool}] Apply this tool to the following request: ${text}`;
      } else if (activeModule === ModuleType.UTILITIES && !activeUtilityTool) {
         promptToSend = `[Module: UTILITIES] ${text}`;
      } else if (activeModule === ModuleType.ORGANIZER) {
         promptToSend = `[Module: RESEARCH_PAPER_ORGANIZER] ${text}`;
      } else if (activeModule === ModuleType.MARKDOWN) {
         promptToSend = `[Module: MARKDOWN_CONVERTER] ${text}`;
      }

      await sendMessageStream(promptToSend, attachment, (streamText) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === aiMessageId) {
            return {
              ...msg,
              text: streamText,
              parsedContent: parseUniProResponse(streamText)
            };
          }
          return msg;
        }));
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMessageId) {
          return { ...msg, text: "Error generating response. Please try again.", parsedContent: { theory: "Error: Could not reach UniPro servers." } };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMessageId) {
            return { ...msg, isLoading: false };
        }
        return msg;
      }));
    }
  };

  const currentAiResponse = messages.slice().reverse().find(m => m.role === Role.MODEL);

  const navItems = [
    { id: ModuleType.ASSIGNMENT, label: 'Assignment Generator', icon: <Brain size={20} />, color: 'text-emerald-400' },
    { id: ModuleType.PROJECT, label: 'Project Generator', icon: <Layout size={20} />, color: 'text-blue-400' },
    { id: ModuleType.THESIS, label: 'Thesis Navigator', icon: <GraduationCap size={20} />, color: 'text-amber-400' },
    { id: ModuleType.UTILITIES, label: 'Academic Utilities', icon: <Wrench size={20} />, color: 'text-purple-400' },
    { id: ModuleType.ORGANIZER, label: 'Research Organizer', icon: <FileText size={20} />, color: 'text-teal-400' },
    { id: ModuleType.MARKDOWN, label: 'Markdown Converter', icon: <FileType size={20} />, color: 'text-cyan-400' },
  ];

  const utilityTools = [
    { id: 'AI_CHECKER', label: 'AI Checker', icon: <ShieldAlert size={16} /> },
    { id: 'PLAGIARISM_SCANNER', label: 'Plagiarism Scanner', icon: <FileSearch size={16} /> },
    { id: 'HUMANIZER', label: 'Humanizer', icon: <Sparkles size={16} /> },
    { id: 'PARAPHRASER', label: 'Paraphraser', icon: <RefreshCcw size={16} /> },
    { id: 'SPINNER', label: 'Spinner', icon: <Repeat size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">UniPro</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveModule(item.id); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeModule === item.id 
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className={activeModule === item.id ? item.color : 'text-slate-500'}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Mode</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {MODULE_DESCRIPTIONS[activeModule]}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        
        {/* Header - Mobile Only Trigger */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-lg">UniPro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-400 hover:text-white">
            <Menu size={24} />
          </button>
        </header>

        {/* Workspace Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500 overflow-y-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20">
                <Brain size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Academic Intelligence <span className="text-blue-400">Reimagined</span>
              </h2>
              <p className="text-slate-400 max-w-md mx-auto text-lg mb-8">
                Select a module below to start. UniPro decomposes tasks into Theory, Code, and Execution.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full text-left">
                 {navItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors cursor-pointer ${activeModule === item.id ? 'ring-2 ring-blue-500 border-transparent' : ''}`} 
                      onClick={() => setActiveModule(item.id)}
                    >
                        <div className={`mb-2 ${item.color}`}>{item.icon}</div>
                        <div className="font-semibold text-sm text-white mb-1">{item.label}</div>
                        <div className="text-xs text-slate-500 line-clamp-2">{MODULE_DESCRIPTIONS[item.id]}</div>
                    </div>
                 ))}
              </div>
            </div>
          ) : (
            <UniProWindows 
              parsedContent={currentAiResponse?.parsedContent} 
              isStreaming={isLoading}
            />
          )}
        </div>

        {/* Utility Toolbar (Visible only in Utilities Mode) */}
        {activeModule === ModuleType.UTILITIES && (
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2">
             <div className="max-w-7xl mx-auto">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs font-semibold text-slate-500 uppercase mr-2">Tools:</span>
                  {utilityTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => setActiveUtilityTool(activeUtilityTool === tool.id ? null : tool.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        activeUtilityTool === tool.id 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      {tool.icon}
                      {tool.label}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        )}

        {/* Input Area */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />

      </main>
    </div>
  );
};

export default App;
