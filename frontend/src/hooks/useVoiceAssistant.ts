'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VoiceAssistantState, VoiceCommandResult, VoicePermissionState, VoiceTranscriptEntry } from '@/lib/types';
import { executeSafeVoiceCommand, parseVoiceCommand, type VoiceCommandContext } from '@/lib/voiceCommands';
import { sanitizeTranscript } from '@/lib/voiceSafety';

interface BrowserSpeechRecognitionResult {
  readonly isFinal?: boolean;
  readonly 0: { transcript: string };
}

interface BrowserSpeechRecognitionEvent {
  readonly results: {
    readonly length: number;
    readonly [index: number]: BrowserSpeechRecognitionResult;
  };
}

interface BrowserSpeechRecognitionErrorEvent {
  readonly error?: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

const MAX_HISTORY = 10;

function getRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function stripWakeWord(text: string): string {
  const wakeWord = process.env.NEXT_PUBLIC_VOICE_WAKE_WORD || 'Sallon';
  const clean = text.trim();
  const prefix = new RegExp(`^${wakeWord}\\b[,\\s-]*`, 'i');
  return clean.replace(prefix, '').trim() || clean;
}

function unsupportedResult(transcript: string): VoiceCommandResult {
  return {
    ok: false,
    intent: 'help',
    message: 'Reconnaissance vocale indisponible. Utilisez le champ texte.',
    blocked: false,
    transcript: sanitizeTranscript(transcript),
  };
}

export function useVoiceAssistant(context: VoiceCommandContext): VoiceAssistantState & {
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  submitTextCommand: (text: string) => Promise<VoiceCommandResult>;
  clearTranscriptHistory: () => void;
} {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<VoiceTranscriptEntry[]>([]);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [permissionState, setPermissionState] = useState<VoicePermissionState>('unknown');

  const enabled = process.env.NEXT_PUBLIC_VOICE_ASSISTANT_ENABLED !== 'false';
  const language = process.env.NEXT_PUBLIC_VOICE_LANGUAGE || 'fr-FR';
  const Recognition = useMemo(() => (enabled ? getRecognitionConstructor() : null), [enabled]);
  const isSupported = Boolean(Recognition);

  const remember = useCallback((safeTranscript: string, result: VoiceCommandResult) => {
    setTranscriptHistory((current) => [
      {
        id: `${Date.now()}-${current.length}`,
        at: new Date().toISOString(),
        transcript: safeTranscript,
        result,
      },
      ...current,
    ].slice(0, MAX_HISTORY));
  }, []);

  const submitTextCommand = useCallback(async (text: string) => {
    const safeTranscript = sanitizeTranscript(stripWakeWord(text));
    setTranscript(safeTranscript);

    const command = parseVoiceCommand(safeTranscript);
    const result = await executeSafeVoiceCommand(command, context);
    setLastResult(result);
    remember(safeTranscript, result);
    return result;
  }, [context, remember]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!Recognition) {
      const result = unsupportedResult(transcript);
      setLastResult(result);
      remember(result.transcript, result);
      setPermissionState('unsupported');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let spoken = '';
      for (let index = 0; index < event.results.length; index += 1) {
        spoken += ` ${event.results[index][0]?.transcript || ''}`;
      }
      void submitTextCommand(spoken);
    };
    recognition.onerror = (event) => {
      setPermissionState(event.error === 'not-allowed' ? 'denied' : 'prompt');
      setIsListening(false);
      const result: VoiceCommandResult = {
        ok: false,
        intent: 'help',
        message: 'Ecoute vocale interrompue. Utilisez le champ texte si besoin.',
        blocked: false,
        transcript: '',
      };
      setLastResult(result);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setPermissionState('prompt');
      setIsListening(true);
    } catch {
      setIsListening(false);
      const result = unsupportedResult(transcript);
      setLastResult(result);
      remember(result.transcript, result);
    }
  }, [Recognition, language, remember, submitTextCommand, transcript]);

  const toggleListening = useCallback(() => {
    if (isListening) stopListening();
    else startListening();
  }, [isListening, startListening, stopListening]);

  const clearTranscriptHistory = useCallback(() => {
    setTranscriptHistory([]);
    setTranscript('');
    setLastResult(null);
  }, []);

  useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  return {
    isSupported,
    isListening,
    permissionState: isSupported ? permissionState : 'unsupported',
    transcript,
    transcriptHistory,
    lastResult,
    startListening,
    stopListening,
    toggleListening,
    submitTextCommand,
    clearTranscriptHistory,
  };
}
