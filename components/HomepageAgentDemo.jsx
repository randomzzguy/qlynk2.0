'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Loader2, Send } from 'lucide-react';
import { NORTHSTAR_DEMO } from '@/lib/demo/northstar-public';

const DEMO_SESSION_KEY = 'qlynk_home_demo_session';
const DEMO_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;
const MAX_QUESTIONS = 3;

function createSession() {
  return { id: crypto.randomUUID(), createdAt: Date.now(), questionCount: 0 };
}

function isValidSession(session) {
  return session
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(session.id || '')
    && Number.isFinite(session.createdAt)
    && session.createdAt > Date.now() - DEMO_SESSION_LIFETIME_MS
    && Number.isInteger(session.questionCount)
    && session.questionCount >= 0;
}

function loadDemoSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_SESSION_KEY) || 'null');
    if (isValidSession(stored)) return stored;
  } catch {
    // Replace malformed browser state with a fresh anonymous demo session.
  }

  const session = createSession();
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  return session;
}

function saveDemoSession(session) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

function parseStreamEvent(event) {
  const dataLine = event
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('data: '));
  if (!dataLine || dataLine === 'data: [DONE]') return '';

  try {
    const data = JSON.parse(dataLine.slice(6));
    return data.choices?.[0]?.delta?.content || '';
  } catch {
    return '';
  }
}

export default function HomepageAgentDemo() {
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', content: NORTHSTAR_DEMO.welcomeMessage },
  ]);
  const [questions, setQuestions] = useState([]);
  const [input, setInput] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const sessionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const session = loadDemoSession();
    sessionRef.current = session;
    setQuestionCount(Math.min(session.questionCount, MAX_QUESTIONS));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const updateAssistantMessage = (messageId, content) => {
    setMessages((current) => current.map((message) => (
      message.id === messageId ? { ...message, content } : message
    )));
  };

  const submitQuestion = async (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isLoading || questionCount >= MAX_QUESTIONS) return;

    let session = sessionRef.current;
    if (!isValidSession(session)) {
      session = loadDemoSession();
      sessionRef.current = session;
    }

    const nextCount = Math.min(session.questionCount + 1, MAX_QUESTIONS);
    session = { ...session, questionCount: nextCount };
    sessionRef.current = session;
    saveDemoSession(session);
    setQuestionCount(nextCount);

    const nextQuestions = [...questions, cleanQuestion].slice(-MAX_QUESTIONS);
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content: cleanQuestion };
    const assistantId = `assistant-${Date.now()}`;
    setQuestions(nextQuestions);
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: nextQuestions, sessionId: session.id }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const limitedSession = { ...session, questionCount: MAX_QUESTIONS };
          sessionRef.current = limitedSession;
          saveDemoSession(limitedSession);
          setQuestionCount(MAX_QUESTIONS);
        }
        throw new Error(errorBody.error || 'The demo could not answer right now.');
      }

      if (!response.body) throw new Error('The demo response was empty.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const event of events) {
          const content = parseStreamEvent(event);
          if (content) {
            assistantContent += content;
            updateAssistantMessage(assistantId, assistantContent);
          }
        }

        if (done) break;
      }

      if (buffer) {
        const content = parseStreamEvent(buffer);
        if (content) assistantContent += content;
      }

      if (!assistantContent) throw new Error('The demo response was empty.');
      updateAssistantMessage(assistantId, assistantContent);
      setHasAnswered(true);
    } catch (error) {
      updateAssistantMessage(
        assistantId,
        error.message || 'The demo could not answer right now. Please try again shortly.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitQuestion(input);
  };

  const limitReached = questionCount >= MAX_QUESTIONS;

  return (
    <div className="relative">
      <div className="absolute -top-6 -right-6 p-4 rounded-2xl bg-gray-800/80 backdrop-blur-xl border border-white/10 shadow-2xl z-20 hidden sm:block">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Try the Live Demo</span>
        </div>
      </div>

      <div className="rounded-[2.5rem] bg-gray-900 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden border-[8px] border-gray-800/80 relative">
        <div className="bg-gray-800/50 px-6 py-4 flex items-center gap-3 border-b border-white/5">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
            <div className="w-3 h-3 rounded-full bg-white/10" />
          </div>
          <div className="flex-1 mx-4 bg-black/20 rounded-full px-4 py-1.5 text-[11px] text-gray-500 font-mono text-center border border-white/5">
            qlynk.site/northstar
          </div>
        </div>

        <div className="bg-[#0c0c12] p-5 sm:p-8 min-h-[520px] flex flex-col">
          <div className="flex items-center gap-5 mb-6 pb-5 border-b border-white/5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange to-[#c14f22] flex items-center justify-center text-xl text-white font-black shadow-lg shadow-orange/20">
              NS
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-none mb-1.5">{NORTHSTAR_DEMO.name}</h3>
              <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">{NORTHSTAR_DEMO.role}</p>
              <p className="text-[11px] text-gray-600 mt-1">Fictional example business</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 min-h-0 max-h-[310px] space-y-4 overflow-y-auto pr-1 custom-scrollbar" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={message.role === 'user'
                  ? 'bg-white/5 border border-white/10 text-white px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-xl'
                  : 'bg-orange/10 border border-orange/20 text-white px-4 py-3 rounded-2xl rounded-tl-sm max-w-[92%] shadow-xl'}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Image src="/assets/iconWhite.svg" alt="" width={14} height={14} />
                      <span className="text-[11px] font-black text-orange uppercase tracking-[0.1em]">Qlynk response</span>
                    </div>
                  )}
                  {message.content ? (
                    <p className="text-sm leading-relaxed text-gray-100 whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Loader2 size={15} className="animate-spin text-orange" />
                      Northstar is answering...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {questionCount === 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {NORTHSTAR_DEMO.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => submitQuestion(question)}
                  disabled={isLoading}
                  className="text-left text-xs leading-snug text-gray-300 border border-white/10 bg-white/5 hover:border-orange/40 hover:text-white rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {hasAnswered && !limitReached && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-orange/20 bg-orange/5 px-4 py-3">
              <p className="text-xs text-gray-300">Want an agent that answers for your business?</p>
              <Link href="/auth/signup" className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-orange hover:text-white transition-colors">
                Create yours free <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {limitReached ? (
            <div className="mt-5 rounded-2xl border border-orange/25 bg-orange/10 p-4 text-center">
              <p className="text-sm font-semibold text-white">You have tried all three demo questions.</p>
              <p className="mt-1 text-xs text-gray-400">Now give an agent your knowledge and let people ask their own questions.</p>
              <Link href="/auth/signup" className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-5 py-3 text-sm font-bold text-white hover:bg-orange/90 transition-colors">
                Create Your Agent for Free <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex items-center gap-2 bg-white/5 border border-white/10 focus-within:border-orange/40 rounded-2xl p-2.5 transition-colors">
              <label htmlFor="homepage-demo-question" className="sr-only">Ask the Northstar Studio demo agent a question</label>
              <input
                id="homepage-demo-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                disabled={isLoading}
                placeholder={`Ask a question · ${MAX_QUESTIONS - questionCount} remaining`}
                className="min-w-0 flex-1 bg-transparent text-white placeholder-gray-600 text-sm px-3 py-2 outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send demo question"
                className="w-10 h-10 shrink-0 bg-orange/20 hover:bg-orange text-orange hover:text-white disabled:opacity-40 disabled:hover:bg-orange/20 disabled:hover:text-orange rounded-xl flex items-center justify-center transition-colors"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          )}

          <p className="mt-3 text-center text-[10px] text-gray-600">Demo conversations are not saved.</p>
        </div>
      </div>
    </div>
  );
}
