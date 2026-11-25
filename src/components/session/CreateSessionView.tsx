import React, { useState } from 'react';
import { createNewSession, CUTE_AVATARS, PlayerInput } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Menu, Plus, Trash2, Users, Smile, ArrowRight } from 'lucide-react';

interface CreateSessionViewProps {
  onOpenHistory: () => void;
  onSessionCreated: (sessionId: string) => void;
}

export const CreateSessionView: React.FC<CreateSessionViewProps> = ({
  onOpenHistory,
  onSessionCreated,
}) => {
  const [sessionTitle, setSessionTitle] = useState<string>(
    `Game Night #${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  );
  const [playerNameInput, setPlayerNameInput] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(CUTE_AVATARS[0]);
  const [playersList, setPlayersList] = useState<PlayerInput[]>([]);

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = playerNameInput.trim();
    if (!trimmed) return;

    if (playersList.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A player with this name has already been added!');
      return;
    }

    sound.playPop();
    haptics.light();
    setPlayersList(prev => [...prev, { name: trimmed, avatarEmoji: selectedAvatar }]);
    setPlayerNameInput('');

    // Advance to next avatar in the 20 list automatically
    const nextIndex = (CUTE_AVATARS.indexOf(selectedAvatar) + 1) % CUTE_AVATARS.length;
    setSelectedAvatar(CUTE_AVATARS[nextIndex]);
  };

  const handleRemovePlayer = (index: number) => {
    sound.playPop();
    haptics.warning();
    setPlayersList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateSession = async () => {
    if (playersList.length < 2) {
      alert('Please add at least 2 players to start!');
      return;
    }

    sound.playSuccess();
    haptics.medium();

    const session = await createNewSession(sessionTitle, playersList);
    onSessionCreated(session.id);
  };

  const canLaunch = playersList.length >= 2;

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-20 select-none">
      {/* Top Header with Hamburger Menu */}
      <div className="flex items-center justify-between py-2">
        <button
          onClick={() => {
            sound.playPop();
            onOpenHistory();
          }}
          className="w-10 h-10 rounded-2xl border-3 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
          title="Open History"
        >
          <Menu className="w-5 h-5 text-gray-800 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl border-2 border-black bg-[#FEF08A] flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#000]">
            🎉
          </div>
          <span className="text-lg font-black tracking-tight text-[#18181B]">PartyPop</span>
        </div>

        <button
          onClick={() => {
            sound.playPop();
            onOpenHistory();
          }}
          className="neo-btn neo-btn-sm px-2.5 py-1.5 bg-[#FED7AA] text-xs font-black text-amber-950"
        >
          📜 Past Sessions
        </button>
      </div>

      {/* Step 1: Session Details Card */}
      <div className="neo-card p-4 bg-white border-3 border-black space-y-2">
        <label className="text-xs font-black uppercase tracking-wider text-gray-500">
          Step 1: Session Name
        </label>
        <input
          type="text"
          value={sessionTitle}
          onChange={e => setSessionTitle(e.target.value)}
          placeholder="Session title (e.g. Friday Game Night)"
          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-black font-black text-base bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          maxLength={30}
        />
      </div>

      {/* Step 2: Add Players with Chunky 20 Icon Picker */}
      <div className="neo-card p-4 bg-white border-3 border-black space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-600" /> Step 2: Add Players ({playersList.length})
          </label>
          <span className="text-[11px] font-bold text-gray-500">
            {playersList.length < 2 ? 'Add 2 or more players' : '✓ Ready to create!'}
          </span>
        </div>

        {/* 20 Big Chunky Avatars Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
            <span className="flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-amber-600" /> Choose Icon (20 available):
            </span>
            <span className="text-xl px-2 py-0.5 rounded-xl border-2 border-black bg-yellow-100 shadow-[1px_1px_0px_#000]">
              {selectedAvatar}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2 rounded-xl border-2 border-black bg-gray-50 max-h-36 overflow-y-auto">
            {CUTE_AVATARS.map(avatar => {
              const isSelected = selectedAvatar === avatar;
              return (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setSelectedAvatar(avatar);
                  }}
                  className={`w-9 h-9 sm:w-8 sm:h-8 rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                    isSelected
                      ? 'border-black bg-[#FEF08A] scale-110 shadow-[2px_2px_0px_#000]'
                      : 'border-transparent bg-white/70 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  {avatar}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddPlayer} className="flex gap-2 pt-1">
          <div className="w-11 h-11 rounded-xl border-2 border-black bg-[#FEF08A] flex items-center justify-center text-2xl shrink-0 shadow-[1px_1px_0px_#000]">
            {selectedAvatar}
          </div>
          <input
            type="text"
            value={playerNameInput}
            onChange={e => setPlayerNameInput(e.target.value)}
            placeholder="Type player name..."
            className="flex-1 px-3.5 py-2 rounded-xl border-2 border-black text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
            maxLength={16}
          />
          <button
            type="submit"
            className="neo-btn px-4 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B] flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Players Chips List */}
        {playersList.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
            {playersList.map((p, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-black bg-gradient-to-r from-yellow-50 to-amber-100 shadow-[2px_2px_0px_#000] text-xs font-black"
              >
                <span className="text-base">{p.avatarEmoji}</span>
                <span>{p.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(idx)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-xl border-2 border-dashed border-gray-300 text-center text-xs font-bold text-gray-400">
            No players added yet. Enter names above to add friends!
          </div>
        )}
      </div>

      {/* Create Session CTA Button */}
      <div className="pt-2">
        <button
          disabled={!canLaunch}
          onClick={handleCreateSession}
          className={`w-full neo-btn py-4 text-lg font-black flex items-center justify-center gap-2 ${
            canLaunch
              ? 'bg-[#A7F3D0] hover:bg-[#86EFAC] text-[#18181B] shadow-[4px_4px_0px_#000]'
              : 'bg-gray-200 text-gray-500 opacity-60 cursor-not-allowed shadow-none'
          }`}
        >
          {canLaunch ? (
            <>
              Create Session → Choose Game 🎮
            </>
          ) : (
            `Add at least ${2 - playersList.length} more player${2 - playersList.length === 1 ? '' : 's'}`
          )}
        </button>
      </div>
    </div>
  );
};
