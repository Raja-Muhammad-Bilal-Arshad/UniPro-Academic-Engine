import React, { useRef, useState } from 'react';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import { FileAttachment } from '../types';

interface ChatInputProps {
  onSend: (message: string, attachment: FileAttachment | null) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((!text.trim() && !attachment) || isLoading) return;
    onSend(text, attachment);
    setText('');
    setAttachment(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          name: file.name,
          type: file.type,
          data: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {attachment && (
          <div className="flex items-center gap-2 bg-slate-800 self-start px-3 py-1.5 rounded-lg text-sm text-slate-300 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <Paperclip size={14} />
            <span className="max-w-xs truncate">{attachment.name}</span>
            <button 
              onClick={removeAttachment} 
              className="ml-2 hover:text-white p-0.5 rounded-full hover:bg-slate-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}
        
        <div className="relative flex items-end gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all shadow-sm">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Attach Image or PDF"
            disabled={isLoading}
          >
            <Paperclip size={20} />
          </button>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "UniPro is processing..." : "Describe your assignment, project, or thesis query..."}
            className="flex-1 bg-transparent text-white placeholder-slate-500 p-3 max-h-32 min-h-[48px] resize-none focus:outline-none"
            rows={1}
            disabled={isLoading}
            style={{ minHeight: '48px', height: 'auto' }}
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />

          <button 
            onClick={handleSend}
            disabled={(!text.trim() && !attachment) || isLoading}
            className={`p-3 rounded-lg transition-all duration-200 ${
              (!text.trim() && !attachment) || isLoading
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md hover:shadow-lg'
            }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        
        <div className="text-center text-xs text-slate-500">
          UniPro AI can make mistakes. Verify critical academic information.
        </div>
      </div>
    </div>
  );
};