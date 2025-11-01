import { useState, useEffect, useRef, useCallback } from 'react';

// FIX: Add types for the browser's SpeechRecognition API, which is not standard in TypeScript's DOM library.
// This provides types for the non-standard Web Speech API, resolving TypeScript errors.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  // Using `any` for event types for simplicity, as full types are verbose
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

// Polyfill for browsers that might have this prefixed.
// FIX: Renamed variable to avoid shadowing the `SpeechRecognition` interface type.
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

interface UseDictationOptions {
  onTranscriptChange?: (transcript: string) => void;
}

export const useDictation = (options?: UseDictationOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // FIX: The type `SpeechRecognition` now correctly refers to the interface,
  // because the constructor variable was renamed to `SpeechRecognitionAPI` to avoid name shadowing.
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // FIX: Check for the existence of the API using the renamed variable.
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // FIX: Instantiate using the renamed `SpeechRecognitionAPI` variable.
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        options?.onTranscriptChange?.(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setError('No speech detected or microphone error. Please check your microphone and try again.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };
    
    recognition.onend = () => {
        // Only set isListening to false if it was intentionally stopped, not on transient errors.
        if (recognitionRef.current) {
            // if we are still meant to be listening, restart it.
            if(isListening) {
                recognition.start();
            }
        }
    };

    recognitionRef.current = recognition;
  }, [options, isListening]);
  
  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // This can happen if start() is called too close to a previous stop().
        setError("Could not start listening. Please wait a moment and try again.");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, transcript, error, startListening, stopListening };
};
