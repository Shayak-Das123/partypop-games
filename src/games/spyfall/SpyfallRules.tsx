import React, { useState } from 'react';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, MapPin, Eye, Sparkles } from 'lucide-react';

interface SpyfallRulesProps {
  playerCount: number;
  onProceed: () => void;
  onBack: () => void;
}

export const SpyfallRules: React.FC<SpyfallRulesProps> = ({
  playerCount,
  onProceed,
  onBack,
}) => {
  const [guidePage, setGuidePage] = useState<number>(0);

  const guidePages = [
    {
      badge: 'Page 1 of 3 • The Core Premise',
      title: 'Everyone Knows The Location — Except ONE Spy!',
      icon: '🕵️',
      color: 'bg-[#FECDD3]',
      bullets: [
        {
          label: 'The Secret Location',
          desc: 'Everyone sees the exact same place (e.g. Eden Gardens Stadium, Airplane, or Indian Wedding) + their specific role (e.g. Batsman, Pilot, or Baraati).',
          tag: 'Non-Spies',
          tagColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        },
        {
          label: 'The Clueless Spy',
          desc: '1 person only sees "YOU ARE THE SPY". They have NO idea where anyone is and must blend in and bluff their way through!',
          tag: 'The Spy',
          tagColor: 'bg-rose-100 text-rose-950 border-rose-300',
        },
        {
          label: 'The Questioning Loop',
          desc: 'Players take turns asking each other 1 conversational question. That person answers, and then asks someone else (cannot ask back immediately).',
          tag: 'Turn Rule',
          tagColor: 'bg-sky-100 text-sky-950 border-sky-300',
        },
      ],
    },
    {
      badge: 'Page 2 of 3 • The Strategy Masterclass',
      title: 'Can Someone "Just Imagine a Location and Say That"?',
      icon: '🧠',
      color: 'bg-[#FEF08A]',
      bullets: [
        {
          label: 'NO — Because It Exposes You!',
          desc: 'If everyone knows we are on an Airplane, and you imagine a movie theater and ask "Can you smell popcorn?", the whole room will immediately turn on you and vote you out!',
          tag: 'Instant Trap',
          tagColor: 'bg-red-100 text-red-950 border-red-300',
        },
        {
          label: 'The Danger of Being Too Obvious',
          desc: 'If you ask "What altitude are we flying at?", the Spy will instantly realize it is an Airplane and steal the game on the spot!',
          tag: 'Caution',
          tagColor: 'bg-amber-100 text-amber-950 border-amber-300',
        },
        {
          label: 'The Art of the Subtle Clue',
          desc: 'Ask things like: "How comfortable are your seats right now?" or "Do we need a ticket to leave?". Subtle enough that only an insider understands!',
          tag: 'Pro Tip',
          tagColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        },
      ],
    },
    {
      badge: 'Page 3 of 3 • Win Conditions',
      title: 'How Do You Actually Win in Spyfall?',
      icon: '🏆',
      color: 'bg-[#A7F3D0]',
      bullets: [
        {
          label: 'Innocents Win (Catching the Spy)',
          desc: 'Stop the clock to accuse a suspect. If the room votes and catches the Spy (and the Spy fails to guess the location), Innocents win (+2 pts each)!',
          tag: 'Innocents',
          tagColor: 'bg-teal-100 text-teal-950 border-teal-300',
        },
        {
          label: 'Spy Wins by Bluffing',
          desc: 'If the timer runs out without the room catching the Spy, or if an innocent player is wrongly accused, the Spy wins (+3 pts)!',
          tag: 'Spy Win',
          tagColor: 'bg-purple-100 text-purple-950 border-purple-300',
        },
        {
          label: 'The Spy’s Dramatic Location Steal',
          desc: 'At ANY time during the round, the Spy can stop the game and guess the location from the grid. If correct, the Spy instantly steals the game (+3 pts)!',
          tag: 'Spy Steal',
          tagColor: 'bg-amber-100 text-amber-950 border-amber-300',
        },
      ],
    },
  ];

  const currentPage = guidePages[guidePage];

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 select-none pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="neo-btn neo-btn-sm bg-white p-2 text-black flex items-center gap-1 font-black shadow-[2px_2px_0px_#000]"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" /> Back to Hub
        </button>
        <span className="neo-badge bg-[#BAE6FD] text-[11px] font-black uppercase text-sky-950">
          How to Play Guide
        </span>
      </div>

      {/* Hero Banner */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">📍</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">Spyfall</h2>
        <p className="text-xs font-bold text-gray-600">
          Ask subtle questions, spot the clueless spy, or guess the secret location!
        </p>
      </div>

      {/* Guide Page Indicator Tabs */}
      <div className="grid grid-cols-3 gap-1.5">
        {guidePages.map((pg, idx) => (
          <button
            key={idx}
            onClick={() => {
              sound.playWhoosh();
              haptics.light();
              setGuidePage(idx);
            }}
            className={`py-2 px-1 text-center rounded-xl border-2 border-black font-black text-[11px] transition-all ${
              guidePage === idx
                ? 'bg-[#FEF08A] shadow-[2px_2px_0px_#000] scale-[1.02]'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Page {idx + 1}
          </button>
        ))}
      </div>

      {/* Active Rule Page Card */}
      <div className="neo-card p-4 sm:p-5 bg-white border-4 border-black space-y-4 shadow-[6px_6px_0px_#000]">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <span className="neo-badge bg-[#BAE6FD] text-[10px] font-black uppercase text-sky-950">
            {currentPage.badge}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={guidePage === 0}
              onClick={() => {
                sound.playWhoosh();
                haptics.light();
                setGuidePage(p => p - 1);
              }}
              className={`p-1.5 rounded-lg border-2 border-black ${
                guidePage === 0 ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'bg-white hover:bg-gray-50 shadow-[1px_1px_0px_#000]'
              }`}
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>
            <button
              disabled={guidePage === guidePages.length - 1}
              onClick={() => {
                sound.playWhoosh();
                haptics.light();
                setGuidePage(p => p + 1);
              }}
              className={`p-1.5 rounded-lg border-2 border-black ${
                guidePage === guidePages.length - 1 ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'bg-white hover:bg-gray-50 shadow-[1px_1px_0px_#000]'
              }`}
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Page Title & Icon */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl border-3 border-black ${currentPage.color} flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000] shrink-0`}>
            {currentPage.icon}
          </div>
          <div>
            <h3 className="text-xl font-black text-[#18181B] leading-tight">
              {currentPage.title}
            </h3>
            <span className="text-[10px] font-bold text-gray-500">
              Swipe or tap arrows to navigate rules
            </span>
          </div>
        </div>

        {/* Bullets */}
        <div className="space-y-2.5">
          {currentPage.bullets.map((b, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl border-2 border-black bg-gray-50 space-y-1 shadow-[2px_2px_0px_#000]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#18181B]">{b.label}</span>
                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black ${b.tagColor}`}>
                  {b.tag}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-700 leading-snug">
                {b.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA to Proceed to Setup */}
      <div className="space-y-2">
        <button
          onClick={() => {
            sound.playPop();
            haptics.medium();
            onProceed();
          }}
          className="w-full neo-btn py-4 bg-[#BAE6FD] hover:bg-[#93C5FD] text-base font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:scale-[0.98]"
        >
          Configure Timers &amp; Locations <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>

        <p className="text-[11px] font-bold text-center text-gray-500">
          {playerCount} players ready. Will the Spy stay undiscovered?
        </p>
      </div>
    </div>
  );
};
