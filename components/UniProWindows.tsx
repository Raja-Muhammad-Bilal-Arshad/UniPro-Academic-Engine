
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BookOpen, Code2, Terminal, Copy, Check, BarChart3, PenTool, List, FileText, FileCode, Network, FileType } from 'lucide-react';
import { Message } from '../types';

interface UniProWindowsProps {
  parsedContent: Message['parsedContent'];
  isStreaming: boolean;
}

const WindowHeader: React.FC<{ 
  title: string; 
  icon: React.ReactNode; 
  action?: React.ReactNode;
  colorClass: string;
}> = ({ title, icon, action, colorClass }) => (
  <div className={`flex items-center justify-between px-4 py-2 border-b border-slate-700 ${colorClass} bg-opacity-10`}>
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-semibold text-sm tracking-wide uppercase">{title}</span>
    </div>
    {action}
  </div>
);

export const UniProWindows: React.FC<UniProWindowsProps> = ({ parsedContent, isStreaming }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'pane1' | 'pane2' | 'pane3'>('pane1');

  if (!parsedContent) return null;

  const { 
    theory, code, codeLanguage, output, 
    metrics, refinedText, changelog,
    latex, conversionNotes, docStructure,
    markdown
  } = parsedContent;

  // Detect Modes
  const isUtility = !!metrics || !!refinedText || !!changelog;
  const isOrganizer = !!latex && !markdown; // Latex specific
  const isMarkdown = !!markdown;
  const isDocTools = isOrganizer || isMarkdown; // Shared visual structure for Organizer/Markdown

  const handleCopyCode = (textToCopy: string) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render Logic for Markdown
  const MarkdownComponents = {
    p: ({ children }: any) => <p className="mb-4 text-slate-300 leading-relaxed">{children}</p>,
    h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-4 text-white border-b border-slate-700 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold mb-3 text-white mt-6">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 text-blue-300 mt-4">{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-slate-300 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="ml-4">{children}</li>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-400 my-4">{children}</blockquote>,
    code: ({ inline, children }: any) => 
      inline 
        ? <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300 font-mono text-sm">{children}</code>
        : <code className="block bg-slate-800 p-2 rounded text-slate-200 font-mono text-sm overflow-x-auto">{children}</code>
  };

  // --- Configuration for Windows based on Mode ---
  
  // PANE 1 CONFIG
  let pane1Title = "Theory & Logic";
  let pane1Icon = <BookOpen size={16} className="text-blue-400"/>;
  let pane1Color = "bg-blue-900";
  let pane1Content = theory;
  let pane1Empty = "Waiting for academic analysis...";

  if (isUtility) {
    pane1Title = "Analysis & Metrics";
    pane1Icon = <BarChart3 size={16} className="text-purple-400"/>;
    pane1Color = "bg-purple-900";
    pane1Content = metrics;
    pane1Empty = "Analyzing text content...";
  } else if (isDocTools) {
    pane1Title = isMarkdown ? "Cleanup Report" : "Conversion Report";
    pane1Icon = <FileText size={16} className="text-teal-400"/>;
    pane1Color = "bg-teal-900";
    pane1Content = conversionNotes;
    pane1Empty = "Analyzing document structure...";
  }

  const pane1 = {
    title: pane1Title,
    icon: pane1Icon,
    colorClass: pane1Color,
    content: pane1Content,
    render: (content: string) => <ReactMarkdown components={MarkdownComponents}>{content}</ReactMarkdown>,
    emptyMsg: pane1Empty
  };

  // PANE 2 CONFIG
  let pane2Title = `Implementation (${codeLanguage || '...' })`;
  let pane2Icon = <Code2 size={16} className="text-emerald-400"/>;
  let pane2Color = "bg-emerald-900";
  let pane2Content = code;
  let pane2Empty = "// Waiting for solution implementation...";

  if (isUtility) {
    pane2Title = "Refined Content";
    pane2Icon = <PenTool size={16} className="text-pink-400"/>;
    pane2Color = "bg-pink-900";
    pane2Content = refinedText;
    pane2Empty = "Processing text refinement...";
  } else if (isOrganizer) {
    pane2Title = "LaTeX Source";
    pane2Icon = <FileCode size={16} className="text-cyan-400"/>;
    pane2Color = "bg-cyan-900";
    pane2Content = latex;
    pane2Empty = "% Waiting for LaTeX conversion...";
  } else if (isMarkdown) {
    pane2Title = "Markdown Source";
    pane2Icon = <FileType size={16} className="text-cyan-400"/>;
    pane2Color = "bg-cyan-900";
    pane2Content = markdown;
    pane2Empty = "<!-- Waiting for Markdown conversion -->";
  }

  const pane2 = {
    title: pane2Title,
    icon: pane2Icon,
    colorClass: pane2Color,
    content: pane2Content,
    canCopy: true,
    render: (content: string) => {
      if (isUtility) {
        return (
           <div className="p-6 font-serif text-lg leading-relaxed text-slate-200 whitespace-pre-wrap">
             {content}
           </div>
        );
      }
      return (
        <SyntaxHighlighter
          language={isOrganizer ? 'latex' : (isMarkdown ? 'markdown' : (codeLanguage || 'python'))}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '0.875rem' }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {content}
        </SyntaxHighlighter>
      );
    },
    emptyMsg: pane2Empty
  };

  // PANE 3 CONFIG
  let pane3Title = "Execution / Output";
  let pane3Icon = <Terminal size={16} className="text-amber-400"/>;
  let pane3Color = "bg-amber-900";
  let pane3Content = output;
  let pane3Empty = "$ _ waiting for execution";

  if (isUtility) {
    pane3Title = "Change Log";
    pane3Icon = <List size={16} className="text-orange-400"/>;
    pane3Color = "bg-orange-900";
    pane3Content = changelog;
    pane3Empty = "Logging modifications...";
  } else if (isDocTools) {
    pane3Title = "Document Structure";
    pane3Icon = <Network size={16} className="text-indigo-400"/>;
    pane3Color = "bg-indigo-900";
    pane3Content = docStructure;
    pane3Empty = "Mapping section hierarchy...";
  }

  const pane3 = {
    title: pane3Title,
    icon: pane3Icon,
    colorClass: pane3Color,
    content: pane3Content,
    render: (content: string) => {
      if (isUtility) {
        return (
          <div className="p-4">
             <ReactMarkdown components={MarkdownComponents}>{content}</ReactMarkdown>
          </div>
        );
      }
      return <pre className="p-4 font-mono text-sm text-green-400 bg-black selection:bg-green-900 whitespace-pre-wrap break-words">{content}</pre>;
    },
    emptyMsg: pane3Empty
  };

  return (
    <div className="flex flex-col h-full gap-4 p-2 sm:p-4 overflow-hidden">
      
      {/* Mobile Tabs */}
      <div className="lg:hidden flex bg-slate-800 rounded-lg p-1 mb-2">
        <button 
          onClick={() => setActiveTab('pane1')}
          className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 ${activeTab === 'pane1' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
        >
          {pane1.icon} {isUtility || isDocTools ? "Analysis" : "Theory"}
        </button>
        <button 
          onClick={() => setActiveTab('pane2')}
          className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 ${activeTab === 'pane2' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
        >
          {pane2.icon} {isUtility ? "Result" : (isDocTools ? "Source" : "Code")}
        </button>
        <button 
          onClick={() => setActiveTab('pane3')}
          className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1 ${activeTab === 'pane3' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
        >
          {pane3.icon} {isUtility ? "Log" : (isDocTools ? "Struct" : "Output")}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-0">
        
        {/* Pane 1 */}
        <div className={`flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg ${activeTab !== 'pane1' ? 'hidden lg:flex' : 'flex'}`}>
          <WindowHeader 
            title={pane1.title} 
            icon={pane1.icon} 
            colorClass={pane1.colorClass}
          />
          <div className="flex-1 overflow-y-auto p-0 scroll-smooth bg-[#0f172a]">
            {pane1.content ? pane1.render(pane1.content) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 p-6 text-center">
                <span className={isStreaming ? "animate-pulse" : ""}>{pane1.emptyMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Pane 2 */}
        <div className={`flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg ${activeTab !== 'pane2' ? 'hidden lg:flex' : 'flex'}`}>
          <WindowHeader 
            title={pane2.title}
            icon={pane2.icon}
            colorClass={pane2.colorClass}
            action={
              pane2.canCopy && pane2.content && (
                <button onClick={() => handleCopyCode(pane2.content || '')} className="text-slate-400 hover:text-white transition-colors">
                  {copied ? <Check size={16} className="text-emerald-400"/> : <Copy size={16} />}
                </button>
              )
            }
          />
          <div className="flex-1 overflow-y-auto relative bg-[#1e1e1e]">
             {pane2.content ? pane2.render(pane2.content) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-sm p-6 text-center">
                 <span>{pane2.emptyMsg}</span>
               </div>
             )}
          </div>
        </div>

        {/* Pane 3 */}
        <div className={`flex flex-col bg-black border border-slate-700 rounded-xl overflow-hidden shadow-lg ${activeTab !== 'pane3' ? 'hidden lg:flex' : 'flex'}`}>
          <WindowHeader 
            title={pane3.title} 
            icon={pane3.icon} 
            colorClass={pane3.colorClass}
          />
          <div className="flex-1 overflow-y-auto bg-black">
            {pane3.content ? pane3.render(pane3.content) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-700 p-6 text-center">
                <span className="opacity-50">{pane3.emptyMsg}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
