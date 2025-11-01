import React from 'react';
import { useDictation } from '../hooks/useDictation';
import { MicrophoneIcon, StopCircleIcon } from './icons';

interface DictationPanelProps {
  dictatedText: string;
  setDictatedText: (text: string) => void;
}

const DictationPanel: React.FC<DictationPanelProps> = ({ dictatedText, setDictatedText }) => {
  const { isListening, transcript, startListening, stopListening, error } = useDictation({
    onTranscriptChange: (newTranscript) => {
      setDictatedText(prev => prev.length > 0 ? `${prev} ${newTranscript}` : newTranscript);
    }
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-4 animate-fade-in h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Patient Notes</h2>
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-white transition-all duration-300 transform hover:scale-105 ${
            isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isListening ? (
            <>
              <StopCircleIcon />
              <span>Stop Dictation</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
            </>
          ) : (
            <>
              <MicrophoneIcon />
              <span>Start Dictation</span>
            </>
          )}
        </button>
      </div>
      {error && <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md">{error}</p>}
      <textarea
        value={dictatedText}
        onChange={(e) => setDictatedText(e.target.value)}
        placeholder="Start dictating or type patient notes here..."
        className="w-full flex-grow p-4 bg-slate-50 dark:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-base resize-none"
      />
    </div>
  );
};

export default DictationPanel;
