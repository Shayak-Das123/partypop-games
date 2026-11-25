import React, { useState } from 'react';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { ArrowLeft, ArrowRight, Shield, ChevronLeft, ChevronRight, Sparkles, Users, CheckCircle2 } from 'lucide-react';
import { RESISTANCE_MATRIX } from './resistanceData';

interface ResistanceRulesProps {
  playerCount: number;
  onProceed: () => void;
  onBack: () => void;
}

export const ResistanceRules: React.FC<ResistanceRulesProps> = ({
  playerCount,
  onProceed,
  onBack,
}) => {
  const [guidePage, setGuidePage] = useState<number>(0);

  const clampedCount = Math.max(5, Math.min(10, playerCount));
  const matrix = RESISTANCE_MATRIX[clampedCount] || RESISTANCE_MATRIX[5];

  const guidePages = [
    {
      badge: 'Page 1 of 3 • The Core Conflict',
      title: 'Resistance vs. Imperial Spies',
      icon: '🛡️',
      color: 'bg-[#E0E7FF]',
      accent: 'border-indigo-400',
      bullets: [
        {
          label: 'The Resistance (Loyal Crew)',
          desc: `${matrix.resistanceCount} Players. You do NOT know who is who. You must deduce who to trust, vote smart on teams, and pass 3 missions!`,
          tag: 'Good Guys',
          tagColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        },
        {
          label: 'Imperial Spies (Infiltrators)',
          desc: `${matrix.spyCount} Players. You secretly know ALL your fellow spies! Blend in, sow confusion, act helpful, and sabotage 3 missions.`,
          tag: 'Evil Minority',
          tagColor: 'bg-red-100 text-red-950 border-red-300',
        },
        {
          label: 'Golden Rule of Loyalty',
          desc: 'Loyal Resistance members CAN NEVER sabotage! Only Spies have the option to cast a secret Sabotage card.',
          tag: 'Strict Rule',
          tagColor: 'bg-amber-100 text-amber-950 border-amber-300',
        },
      ],
    },
    {
      badge: 'Page 2 of 3 • How Each Round Works',
      title: 'The 4-Step Mission Loop',
      icon: '🔄',
      color: 'bg-[#FEF08A]',
      accent: 'border-yellow-400',
      bullets: [
        {
          label: '1. Leader Proposes Team',
          desc: 'The current mission leader selects the exact required number of operatives to go into the field.',
          tag: 'Proposal',
          tagColor: 'bg-yellow-100 text-yellow-950 border-yellow-300',
        },
        {
          label: '2. Public Room Vote',
          desc: 'Everyone openly votes APPROVE or REJECT. If rejected 5 times in a row, Spies win immediately by anarchy!',
          tag: 'Vote Track',
          tagColor: 'bg-orange-100 text-orange-950 border-orange-300',
        },
        {
          label: '3. Secret Mission Action',
          desc: 'The chosen operatives take the phone in secret. Resistance must vote SUCCESS. Spies choose SUCCESS or SABOTAGE.',
          tag: 'Pass Phone',
          tagColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        },
        {
          label: '4. Anonymous Reveal',
          desc: 'Votes are shuffled! If even 1 Sabotage appears, the mission fails! First team to 3 mission points wins the war!',
          tag: 'First to 3',
          tagColor: 'bg-rose-100 text-rose-950 border-rose-300',
        },
      ],
    },
    {
      badge: 'Page 3 of 3 • Strategy Masterclass',
      title: 'Why Does a Mission Need Only 2 Players?',
      icon: '🎯',
      color: 'bg-[#A7F3D0]',
      accent: 'border-emerald-400',
      bullets: [
        {
          label: 'Zero Information at Start',
          desc: 'On Mission 1, the Resistance knows nothing. If you sent 4 or 5 people, you would guarantee putting 2 spies on the team and learn nothing.',
          tag: 'Deduction',
          tagColor: 'bg-teal-100 text-teal-950 border-teal-300',
        },
        {
          label: 'Isolating the Suspects',
          desc: 'By sending only 2 players: if 1 Sabotage appears, you know with 100% mathematical certainty that either Player A or Player B is a Spy!',
          tag: '100% Proof',
          tagColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        },
        {
          label: 'High-Trust Allies',
          desc: 'If the 2-person mission succeeds with 0 sabotages, you now have strong candidates for future high-stake teams.',
          tag: 'Alliance',
          tagColor: 'bg-blue-100 text-blue-950 border-blue-300',
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
        <span className="neo-badge bg-[#E0E7FF] text-[11px] font-black uppercase text-indigo-950">
          How to Play Guide
        </span>
      </div>

      {/* Hero Banner */}
      <div className="text-center space-y-1">
        <div className="text-4xl animate-bounce">🛡️</div>
        <h2 className="text-3xl font-black text-[#18181B] tracking-tight">The Resistance</h2>
        <p className="text-xs font-bold text-gray-600">
          Read the 3-page guide before starting to master your deduction strategy!
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
          <span className="neo-badge bg-[#E0E7FF] text-[10px] font-black uppercase text-indigo-950">
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
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-base font-black text-[#18181B] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:scale-[0.98]"
        >
          Configure &amp; Start Game <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>

        <p className="text-[11px] font-bold text-center text-gray-500">
          Need 5-10 players. Ready to test your team's loyalty?
        </p>
      </div>
    </div>
  );
};
