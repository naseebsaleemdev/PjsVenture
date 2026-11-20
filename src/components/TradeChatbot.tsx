import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { formatAutoPrice } from '../data/seedInventory.ts';
import type { AutoCurrency, ExportVehicle } from '../types/autoTrade.ts';
import type { AppRoute } from './Navbar';

interface ChatTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  matchedVehicleIds?: string[];
}

interface TradeChatbotProps {
  vehicles: ExportVehicle[];
  currency: AutoCurrency;
  onInspectVehicle: (vehicle: ExportVehicle) => void;
  onBookVehicle: (vehicle: ExportVehicle) => void;
  onNavigate: (route: AppRoute) => void;
}

const STARTER_PROMPTS = [
  'Which vehicles are available right now?',
  'Explain Port Balance-Release deals',
  'RoRo freight cost to Nassau or Kingston?',
  'How does Japan export & DHL B/L work?',
];

function findMentionedVehicleIds(replyText: string, vehicles: ExportVehicle[]): string[] {
  const lower = replyText.toLowerCase();
  const matched: string[] = [];
  for (const v of vehicles) {
    const hasChassis = v.chassisCode && lower.includes(v.chassisCode.toLowerCase());
    const hasModel = v.makeModel && lower.includes(v.makeModel.toLowerCase());
    if (hasChassis || hasModel) {
      matched.push(v.id);
    }
    if (matched.length >= 3) break;
  }
  return matched;
}

export function TradeChatbot({
  vehicles,
  currency,
  onInspectVehicle,
  onBookVehicle,
  onNavigate,
}: TradeChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, loading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    const userTurn: ChatTurn = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const nextTurns = [...turns, userTurn];
    setTurns(nextTurns);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currency,
          messages: nextTurns.map((t) => ({ role: t.role, text: t.text })),
          vehicles: vehicles.map((v) => ({
            id: v.id,
            year: v.year,
            makeModel: v.makeModel,
            trim: v.trim,
            status: v.status,
            chassisCode: v.chassisCode,
            fobUsd: v.fobUsd,
            fuel: v.fuel,
            drive: v.drive,
            steering: v.steering,
            mileageKm: v.mileageKm,
            dealType: v.transit.dealType,
            destinationPortLabel: v.transit.destinationPortLabel,
            balanceDueUsd: v.transit.balanceDueUsd,
            priorDepositUsd: v.transit.priorDepositUsd,
            overallGrade: v.inspection.overallGrade,
          })),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Could not reach the PJS Ventures chat desk.');
      }

      const matchedVehicleIds = findMentionedVehicleIds(data.reply, vehicles);
      setTurns((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: data.reply!,
          matchedVehicleIds,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to send message right now. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          aria-label="PJS Ventures Export Concierge Chat"
          className="w-[calc(100vw-2rem)] sm:w-[400px] h-[min(580px,calc(100vh-6.5rem))] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Chat Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                <img
                  src="/assets/aistudio/PJS_Ventures_-_Transparent__White_Theme__3ad2a367.png"
                  alt="PJS Ventures"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold text-zinc-950 truncate">
                  PJS Ventures Concierge
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Live stock, CIF freight &amp; export guide
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTurns([]);
                    setError(null);
                  }}
                  title="Reset chat"
                  aria-label="Reset chat conversation"
                  className="p-2 rounded-lg text-slate-500 hover:text-zinc-950 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="p-2 rounded-lg text-slate-500 hover:text-zinc-950 hover:bg-slate-200/70 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Conversation Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white"
          >
            {turns.length === 0 ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1.5">
                  <div className="font-semibold text-zinc-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-900" aria-hidden="true" />
                    <span>Ask anything about Japanese imports</span>
                  </div>
                  <p>
                    Ask about available cars ({vehicles.length} in live stock), RoRo or container
                    freight to 30+ ports, auction grades, or Port Balance-Release units.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Popular Questions
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="text-left px-3 py-2 text-xs font-medium text-zinc-950 bg-slate-50 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              turns.map((turn) => {
                const matchedVehicles = (turn.matchedVehicleIds || [])
                  .map((id) => vehicles.find((v) => v.id === id))
                  .filter((v): v is ExportVehicle => Boolean(v));

                return (
                  <div
                    key={turn.id}
                    className={`flex flex-col ${
                      turn.role === 'user' ? 'items-end' : 'items-start'
                    } space-y-2`}
                  >
                    <div
                      className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        turn.role === 'user'
                          ? 'bg-blue-900 text-white'
                          : 'bg-slate-100 text-zinc-950 border border-slate-200'
                      }`}
                    >
                      {turn.text}
                    </div>

                    {matchedVehicles.length > 0 && (
                      <div className="w-full max-w-[92%] space-y-1.5">
                        {matchedVehicles.map((veh) => (
                          <div
                            key={veh.id}
                            className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-zinc-950 truncate">
                                {veh.year} {veh.makeModel}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 truncate">
                                {veh.chassisCode} ·{' '}
                                {formatAutoPrice(veh.transit.balanceDueUsd, currency)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  onInspectVehicle(veh);
                                }}
                                className="px-2 py-1 text-[11px] font-medium text-zinc-950 bg-white border border-slate-200 hover:border-blue-900 rounded cursor-pointer"
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  onBookVehicle(veh);
                                }}
                                className="px-2 py-1 text-[11px] font-semibold text-white bg-[#C81E1E] hover:bg-[#A51616] rounded cursor-pointer"
                              >
                                Book
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-start">
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500">
                  Checking stock &amp; port rates...
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
              >
                {error}
              </div>
            )}
          </div>

          {/* Quick Storefront Shortcuts */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('/calculator');
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-blue-900 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
              <span>CIF Calculator</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate('/book');
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:underline cursor-pointer"
            >
              <span>Book / Custom Order</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>

          {/* Input Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-end gap-2 shrink-0"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about cars, CIF ports, or booking..."
              aria-label="Ask PJS Ventures Export Concierge"
              className="flex-1 resize-none max-h-24 px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-zinc-950 placeholder:text-slate-400 focus:outline-none focus:border-blue-900"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send message"
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#C81E1E] hover:bg-[#A51616] disabled:bg-slate-300 text-white transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close PJS Ventures chat' : 'Open PJS Ventures Export Concierge chat'}
        className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#12315B] text-white shadow-lg border border-white/15 transition-colors cursor-pointer"
      >
        {isOpen ? (
          <>
            <X className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-semibold">Close Chat</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-semibold">Ask Export Concierge</span>
          </>
        )}
      </button>
    </div>
  );
}
