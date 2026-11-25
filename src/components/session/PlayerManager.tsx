import React, { useState } from 'react';
import { Player, addPlayerToSession, removePlayerFromSession, updatePlayerOrder, CUTE_AVATARS } from '../../services/db';
import { sound } from '../../services/soundboard';
import { haptics } from '../../services/haptics';
import { Plus, Trash2, ArrowUp, ArrowDown, UserPlus, Users, Sparkles, Smile } from 'lucide-react';

interface PlayerManagerProps {
  sessionId: string;
  players: Player[];
  scores: Record<string, number>;
  onClose: () => void;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  sessionId,
  players,
  scores,
  onClose,
}) => {
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    CUTE_AVATARS[players.length % CUTE_AVATARS.length]
  );
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    sound.playPop();
    haptics.light();
    await addPlayerToSession(sessionId, newPlayerName.trim(), selectedAvatar);
    setNewPlayerName('');
    setIsAdding(false);

    // Advance avatar
    const nextIdx = (CUTE_AVATARS.indexOf(selectedAvatar) + 1) % CUTE_AVATARS.length;
    setSelectedAvatar(CUTE_AVATARS[nextIdx]);
  };

  const handleRemove = async (playerId: string) => {
    if (players.length <= 2) {
      alert('You need at least 2 players in a session!');
      return;
    }
    sound.playPop();
    haptics.warning();
    await removePlayerFromSession(sessionId, playerId);
  };

  const movePlayer = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= players.length) return;

    sound.playPop();
    haptics.light();
    const updated = [...players];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    await updatePlayerOrder(sessionId, updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 select-none">
      <div className="w-full max-w-md neo-card-lg bg-[#FFFDF7] p-5 max-h-[85vh] flex flex-col space-y-4 animate-pop">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-xl font-black text-[#18181B]">Player Roster</h2>
              <p className="text-[11px] font-bold text-gray-500">
                {players.length} players • Reorder or add new
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="neo-btn neo-btn-sm px-3 py-1 bg-white text-xs font-black"
          >
            Done ✓
          </button>
        </div>

        {/* Players List with reorder controls */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {players.map((p, idx) => {
            const score = scores[p.id] || 0;
            return (
              <div
                key={p.id}
                className="p-3 rounded-2xl border-3 border-black bg-white flex items-center justify-between shadow-[2px_2px_0px_#000]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-400 w-4">{idx + 1}.</span>
                  <span className="text-2xl">{p.avatarEmoji}</span>
                  <div>
                    <div className="text-sm font-black text-[#18181B]">{p.name}</div>
                    <div className="text-[10px] font-bold text-gray-500">{score} total session pts</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Reorder Buttons */}
                  <button
                    disabled={idx === 0}
                    onClick={() => movePlayer(idx, 'up')}
                    className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center ${
                      idx === 0 ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'bg-gray-50 active:bg-gray-200'
                    }`}
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === players.length - 1}
                    onClick={() => movePlayer(idx, 'down')}
                    className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center ${
                      idx === players.length - 1 ? 'opacity-30 cursor-not-allowed bg-gray-100' : 'bg-gray-50 active:bg-gray-200'
                    }`}
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="w-7 h-7 rounded-lg border-2 border-black bg-red-50 text-red-600 flex items-center justify-center active:bg-red-200 ml-1"
                    title="Remove player"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Player Input with 20 Icon Picker */}
        {isAdding ? (
          <form onSubmit={handleAdd} className="space-y-2 pt-1 border-t-2 border-black/10">
            {/* 20 Icon Picker */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
                <span>Select Icon (20 available):</span>
                <span className="text-base">{selectedAvatar}</span>
              </div>
              <div className="grid grid-cols-10 gap-1 p-1.5 rounded-xl border-2 border-black bg-gray-50 max-h-20 overflow-y-auto">
                {CUTE_AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setSelectedAvatar(avatar);
                    }}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-sm ${
                      selectedAvatar === avatar
                        ? 'bg-[#FEF08A] border-2 border-black scale-110'
                        : 'hover:bg-gray-200'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Player name (e.g. Maya)"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border-2 border-black text-sm font-black bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                maxLength={15}
              />
              <button
                type="submit"
                className="neo-btn px-4 bg-[#A7F3D0] text-sm font-black text-[#18181B]"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="neo-btn neo-btn-sm px-3 bg-white text-xs font-black"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => {
              sound.playPop();
              setIsAdding(true);
            }}
            className="w-full neo-btn py-3 bg-[#FEF08A] hover:bg-[#FDE047] text-sm font-black text-[#18181B] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> + Add Another Player
          </button>
        )}
      </div>
    </div>
  );
};
