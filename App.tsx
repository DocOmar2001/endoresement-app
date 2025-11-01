import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import ActionButton from './components/ActionButton';
import { DictationIcon, ImageIcon, DiagnosisIcon, ChatIcon } from './components/icons';
import DictationPanel from './components/DictationPanel';
import ImageAnalysisPanel from './components/ImageAnalysisPanel';
import DiagnosisPanel from './components/DiagnosisPanel';
import ChatPanel from './components/ChatPanel';
import type { Diagnosis } from './types';

type View = 'dictation' | 'image' | 'diagnosis' | 'chat';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dictation');
  const [dictatedText, setDictatedText] = useState<string>('');
  const [imageAnalysis, setImageAnalysis] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<Diagnosis[] | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isDiagnosisEnabled = useMemo(() => {
    return dictatedText.trim().length > 0 || imageAnalysis.trim().length > 0;
  }, [dictatedText, imageAnalysis]);

  const renderContent = () => {
    switch (currentView) {
      case 'dictation':
        return <DictationPanel dictatedText={dictatedText} setDictatedText={setDictatedText} />;
      case 'image':
        return <ImageAnalysisPanel imageAnalysis={imageAnalysis} setImageAnalysis={setImageAnalysis} />;
      case 'diagnosis':
        return <DiagnosisPanel 
                  dictatedText={dictatedText} 
                  imageAnalysis={imageAnalysis}
                  diagnosis={diagnosis}
                  setDiagnosis={setDiagnosis}
                  isLoading={isLoadingDiagnosis}
                  setIsLoading={setIsLoadingDiagnosis}
                  error={error}
                  setError={setError}
                />;
      case 'chat':
        return <ChatPanel 
                  dictatedText={dictatedText}
                  imageAnalysis={imageAnalysis}
                  diagnosis={diagnosis}
                />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans text-slate-800 dark:text-slate-200">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col gap-4 overflow-y-auto">
        {renderContent()}
      </main>
      <footer className="bg-white dark:bg-slate-800 shadow-t-lg sticky bottom-0 border-t border-slate-200 dark:border-slate-700">
        <div className="container mx-auto p-4 flex justify-center items-center gap-2 sm:gap-8">
          <ActionButton
            icon={<DictationIcon />}
            label="Dictation"
            isActive={currentView === 'dictation'}
            onClick={() => setCurrentView('dictation')}
          />
          <ActionButton
            icon={<ImageIcon />}
            label="Image Analysis"
            isActive={currentView === 'image'}
            onClick={() => setCurrentView('image')}
          />
          <ActionButton
            icon={<DiagnosisIcon />}
            label="Diagnosis"
            isActive={currentView === 'diagnosis'}
            onClick={() => setCurrentView('diagnosis')}
            disabled={!isDiagnosisEnabled}
          />
          <ActionButton
            icon={<ChatIcon />}
            label="Chat Consult"
            isActive={currentView === 'chat'}
            onClick={() => setCurrentView('chat')}
            disabled={!isDiagnosisEnabled}
          />
        </div>
      </footer>
    </div>
  );
};

export default App;