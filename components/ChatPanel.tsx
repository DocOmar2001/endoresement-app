import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Diagnosis, ChatMessage } from '../types';
import { StethoscopeIcon } from './icons';

interface ChatPanelProps {
  dictatedText: string;
  imageAnalysis: string;
  diagnosis: Diagnosis[] | null;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const ChatPanel: React.FC<ChatPanelProps> = ({ dictatedText, imageAnalysis, diagnosis }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initializeChat = () => {
      const diagnosisText = diagnosis
        ? diagnosis.map(d => `- ${d.potentialDiagnosis} (Confidence: ${d.confidence}): ${d.rationale}`).join('\n')
        : 'Not generated yet.';

      const systemInstruction = `You are MedEndorse AI, an expert clinical assistant. A doctor wants to discuss a case with you.
      Here is the information you have so far:

      Patient Notes:
      ---
      ${dictatedText || 'No notes provided.'}
      ---

      Medical Image Analysis:
      ---
      ${imageAnalysis || 'No image analysis provided.'}
      ---

      Initial Differential Diagnosis:
      ---
      ${diagnosisText}
      ---
      
      Your role is to engage in a thoughtful conversation with the doctor. Help them analyze the case, consider different possibilities, discuss management plans, and answer their questions. Be concise, helpful, and base your responses on the provided data. Start the conversation by greeting the doctor and confirming you've reviewed the case.`;

      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
          systemInstruction: systemInstruction,
        },
      });

      setMessages([{
        role: 'model',
        content: "Hello Doctor. I've reviewed the case file with the patient's notes, image analysis, and initial diagnosis. How can I help you analyze it further?"
      }]);
    };

    if (!chatRef.current) {
      initializeChat();
    }
  }, [dictatedText, imageAnalysis, diagnosis]);
  
  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chatRef.current) return;

    const userMessage: ChatMessage = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const stream = await chatRef.current.sendMessageStream({ message: userInput });
      
      let modelResponse = '';
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-4 animate-fade-in h-full">
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
         <div className="text-blue-600 dark:text-blue-400">
            <StethoscopeIcon className="w-8 h-8"/>
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Chat Consult</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Discuss the current case</p>
        </div>
      </div>
      <div ref={scrollRef} className="flex-grow overflow-y-auto pr-2 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <StethoscopeIcon className="w-5 h-5"/>
                </div>
            )}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-lg'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-lg'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
             <div className="flex items-end gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <StethoscopeIcon className="w-5 h-5"/>
                </div>
                <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 rounded-bl-lg">
                    <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-slate-400 rounded-full animate-pulse"></span>
                    </div>
                </div>
            </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a question about the case..."
          disabled={isLoading}
          className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button type="submit" disabled={isLoading || !userInput.trim()} className="bg-blue-600 text-white font-semibold py-3 px-5 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
