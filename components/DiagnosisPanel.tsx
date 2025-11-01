import React, { useCallback, useEffect, useState } from 'react';
import type { Diagnosis } from '../types';
import { getDifferentialDiagnosis, getManagementPlan } from '../services/geminiService';
import Spinner from './Spinner';
import { StethoscopeIcon, LinkIcon } from './icons';

interface DiagnosisPanelProps {
  dictatedText: string;
  imageAnalysis: string;
  diagnosis: Diagnosis[] | null;
  setDiagnosis: (diagnosis: Diagnosis[] | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  dictatedText,
  imageAnalysis,
  diagnosis,
  setDiagnosis,
  isLoading,
  setIsLoading,
  error,
  setError
}) => {
  const [loadingManagementFor, setLoadingManagementFor] = useState<string | null>(null);
  const [managementError, setManagementError] = useState<{ index: number; message: string } | null>(null);

  const handleGetDiagnosis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setDiagnosis(null); // Clear previous diagnosis
    try {
      const result = await getDifferentialDiagnosis(dictatedText, imageAnalysis);
      setDiagnosis(result);
    } catch (err) {
      setError('Failed to get differential diagnosis. The model may have returned an unexpected format.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [dictatedText, imageAnalysis, setIsLoading, setError, setDiagnosis]);

  const handleGetManagementPlan = useCallback(async (diagnosisName: string, index: number) => {
    setLoadingManagementFor(diagnosisName);
    setManagementError(null);
    try {
      const { plan, sources } = await getManagementPlan(diagnosisName);
      setDiagnosis(prevDiagnosis => {
        if (!prevDiagnosis) return null;
        const newDiagnosis = [...prevDiagnosis];
        newDiagnosis[index] = { 
          ...newDiagnosis[index], 
          managementPlan: plan, 
          managementPlanSources: sources 
        };
        return newDiagnosis;
      });
    } catch (err) {
      console.error(err);
      setManagementError({ index, message: 'Failed to load guidelines.' });
    } finally {
      setLoadingManagementFor(null);
    }
  }, [setDiagnosis]);

  useEffect(() => {
    if (dictatedText || imageAnalysis) {
        if(!diagnosis && !isLoading && !error) {
            handleGetDiagnosis();
        }
    }
  }, []);

  const getConfidenceClass = (confidence: 'High' | 'Medium' | 'Low') => {
    switch (confidence) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-600 dark:text-slate-300';
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
          <Spinner size="lg" />
          <p className="mt-4 text-lg">Generating Diagnosis...</p>
        </div>
      );
    }

    if (error) {
      return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
    }

    if (diagnosis) {
      return (
        <div className="space-y-4">
          {diagnosis.map((item, index) => (
            <div key={index} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg text-blue-700 dark:text-blue-400">{item.potentialDiagnosis}</h4>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getConfidenceClass(item.confidence)}`}>
                  {item.confidence} Confidence
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-semibold text-slate-600 dark:text-slate-300">Rationale:</h5>
                  <p className="text-slate-700 dark:text-slate-300">{item.rationale}</p>
                </div>
                <div>
                  <h5 className="font-semibold text-slate-600 dark:text-slate-300">Next Steps:</h5>
                  <p className="text-slate-700 dark:text-slate-300">{item.nextSteps}</p>
                </div>
              </div>
              <div className="mt-4">
                {item.managementPlan ? (
                  <div className="space-y-3 text-sm animate-fade-in">
                    <h5 className="font-semibold text-slate-600 dark:text-slate-300">Management Guidelines:</h5>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{item.managementPlan}</p>
                    {item.managementPlanSources && item.managementPlanSources.length > 0 && (
                      <div className="pt-2">
                        <h6 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sources</h6>
                        <ul className="mt-1 space-y-1">
                          {item.managementPlanSources.map((source, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <LinkIcon />
                              <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate" title={source.title || source.uri}>
                                {source.title || source.uri}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setManagementError(null);
                        handleGetManagementPlan(item.potentialDiagnosis, index);
                      }}
                      disabled={loadingManagementFor === item.potentialDiagnosis}
                      className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-wait transition-colors flex items-center justify-center min-w-[200px]"
                    >
                      {loadingManagementFor === item.potentialDiagnosis ? (
                        <>
                          <Spinner size="sm" />
                          <span className="ml-2">Fetching Guidelines...</span>
                        </>
                      ) : (
                        'View Management Guidelines'
                      )}
                    </button>
                    {managementError && managementError.index === index && (
                      <p className="text-xs text-red-500 mt-2">{managementError.message}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
        <div className="text-center text-slate-500 dark:text-slate-400 h-full flex flex-col justify-center items-center">
            <StethoscopeIcon className="w-16 h-16 mb-4"/>
            <h3 className="text-xl font-semibold">Differential Diagnosis</h3>
            <p>AI-generated differential diagnosis will appear here.</p>
            <p className="mt-2 text-sm">Please provide patient notes or image analysis first.</p>
        </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 sm:p-6 flex flex-col gap-4 animate-fade-in h-full">
      <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Differential Diagnosis</h2>
          <button
            onClick={handleGetDiagnosis}
            disabled={isLoading || (!dictatedText && !imageAnalysis)}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex justify-center items-center min-w-[120px]"
          >
            {isLoading ? <Spinner /> : 'Regenerate'}
          </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default DiagnosisPanel;