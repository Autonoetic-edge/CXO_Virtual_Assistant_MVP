import React, { useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

const VoiceInput = ({ onTranscript, onListeningChange }) => {
  const {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput();

  useEffect(() => {
    if (transcript) {
      onTranscript?.(transcript);
    }
  }, [transcript, onTranscript]);

  useEffect(() => {
    onListeningChange?.(isListening);
  }, [isListening, onListeningChange]);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={`p-3 rounded-full transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-primary text-white hover:bg-primary-600'
        }`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>
      {isListening && (
        <span className="text-sm text-red-500 animate-pulse">
          Listening...
        </span>
      )}
    </div>
  );
};

export default VoiceInput;
