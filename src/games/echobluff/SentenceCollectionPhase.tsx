import React, { useState } from 'react';
import { Player } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Lock, Eye, ArrowRight, Sparkles, Send } from 'lucide-react';
import { generateAISentence } from './data/topicsAndSentences';

export interface SentenceSubmission {
  authorId: string; // Player ID or 'ai'
  authorName: string;
  isAi: boolean;
  sentence: string;
}

interface SentenceCollectionPhaseProps {
  players: Player[];
  topic: string;
  onAllSubmitted: (submissions: SentenceSubmission[], mysterySubmission: SentenceSubmission) => void;
}

export const SentenceCollectionPhase: React.FC<SentenceCollectionPhaseProps> = ({
  players,
  topic,
  onAllSubmitted,
}) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [submissions, setSubmissions] = useState<SentenceSubmission[]>([]);

  const currentPlayer = players[currentPlayerIndex];

  const handleUnlock = () => {
    sound.playSwipe();
    haptics.medium();
    setIsUnlocked(true);
  };

  const handleSubmitSentence = () => {
    if (!inputText.trim()) return;

    sound.playPop();
    haptics.success();

    const newSubmissions: SentenceSubmission[] = [
      ...submissions,
      {
        authorId: currentPlayer.id,
        authorName: currentPlayer.name,
        isAi: false,
        sentence: inputText.trim(),
      },
    ];

    setSubmissions(newSubmissions);
    setInputText('');
    setIsUnlocked(false);

    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(i => i + 1);
    } else {
      // 30% chance of AI playing in this round!
      const hasAiThisRound = Math.random() < 0.30;
      const allPool: SentenceSubmission[] = [...newSubmissions];

      if (hasAiThisRound) {
        const aiSentence = generateAISentence(topic);
        const aiSubmission: SentenceSubmission = {
          authorId: 'ai',
          authorName: 'The AI',
          isAi: true,
          sentence: aiSentence,
        };
        allPool.push(aiSubmission);
      }

      // Pick one random sentence to be the center of debate this round!
      const mysteryItem = allPool[Math.floor(Math.random() * allPool.length)];

      onAllSubmitted(allPool, mysteryItem);
    }
  };

  // Locked Pass Screen (Privacy Curtain)
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-6 select-none pb-12 text-center">
        {/* Pass Device Banner */}
        <div className="p-6 rounded-3xl border-4 border-black bg-[#DDD6FE] shadow-[6px_6px_0px_#000] space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl border-3 border-black bg-white flex items-center justify-center text-3xl shadow-[3px_3px_0px_#000]">
            🔒
          </div>

          <div className="space-y-1">
            <span className="neo-badge bg-white text-[11px] font-black uppercase text-purple-950">
              Player {currentPlayerIndex + 1} of {players.length}
            </span>
            <h2 className="text-2xl font-black text-[#18181B]">Pass Phone to</h2>
            <div className="text-3xl font-black text-[#18181B] flex items-center justify-center gap-2 pt-1">
              <span>{currentPlayer.avatarEmoji}</span>
              <span>{currentPlayer.name}</span>
            </div>
          </div>

          <p className="text-xs font-bold text-purple-900 leading-relaxed">
            Keep your screen hidden from others! You will write 1 secret sentence.
          </p>
        </div>

        {/* Unlock Button */}
        <button
          onClick={handleUnlock}
          className="w-full neo-btn py-4 bg-[#FEF08A] hover:bg-[#FDE047] text-lg font-black text-[#18181B] shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2"
        >
          <Eye className="w-5 h-5 stroke-[2.5]" />
          I am {currentPlayer.name} (Reveal)
        </button>
      </div>
    );
  }

  // Active Writing Screen
  return (
    <div className="w-full max-w-sm mx-auto space-y-4 select-none pb-12">
      {/* Player identity banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentPlayer.avatarEmoji}</span>
          <span className="text-sm font-black text-[#18181B]">{currentPlayer.name}'s Secret Turn</span>
        </div>
        <span className="neo-badge bg-[#DDD6FE] text-[10px] font-black text-purple-950">
          {currentPlayerIndex + 1} / {players.length}
        </span>
      </div>

      {/* Topic Card */}
      <div className="neo-card p-5 bg-[#FEF08A] border-4 border-black text-center space-y-2 shadow-[4px_4px_0px_#000]">
        <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
          The Round Topic
        </div>
        <div className="text-3xl font-black text-[#18181B] tracking-tight">
          "{topic}"
        </div>
        <p className="text-xs font-bold text-amber-950 leading-snug">
          Write any sentence! It can be a genuine memory, a crazy opinion, or a total bluff like: <span className="italic">"I love pineapple juice as well."</span>
        </p>
      </div>

      {/* Sentence Input Box */}
      <div className="neo-card p-4 bg-white border-3 border-black space-y-3 shadow-[3px_3px_0px_#000]">
        <label className="text-xs font-black uppercase tracking-wide text-gray-700 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-600" />
          Your Secret Sentence
        </label>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Write something about or inspired by ${topic}...`}
          maxLength={140}
          rows={3}
          className="w-full p-3 rounded-xl border-2 border-black bg-gray-50 text-sm font-bold text-[#18181B] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
          <span>Make it sound natural or deceptive!</span>
          <span>{inputText.length}/140</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitSentence}
        disabled={!inputText.trim()}
        className={`w-full neo-btn py-4 text-base font-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] ${
          inputText.trim()
            ? 'bg-[#DDD6FE] hover:bg-[#C4B5FD] text-[#18181B]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-400 shadow-none'
        }`}
      >
        <Lock className="w-5 h-5 stroke-[2.5]" />
        Lock In Secret Sentence
      </button>
    </div>
  );
};
