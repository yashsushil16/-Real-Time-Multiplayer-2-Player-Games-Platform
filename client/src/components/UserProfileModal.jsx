import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Check } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, avatars, updateUserProfile } = useSocket();
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateUserProfile(name.trim(), selectedAvatar);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="card-geo bg-white w-full max-w-md p-6 relative animate-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#FF5A5F] text-white border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] flex items-center justify-center font-bold hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-[#1E1E24] mb-4 flex items-center gap-2">
          <span>🎨</span> Customize Profile
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[#1E1E24] mb-1">
              Choose Avatar
            </label>
            <div className="grid grid-cols-5 gap-2">
              {avatars.map((av) => (
                <button
                  type="button"
                  key={av}
                  onClick={() => setSelectedAvatar(av)}
                  className={`h-12 text-2xl rounded-xl border-[2px] border-[#1E1E24] flex items-center justify-center transition-all ${
                    selectedAvatar === av
                      ? 'bg-[#FFD166] shadow-[3px_3px_0px_#1E1E24] scale-105'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#1E1E24] mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={18}
              className="input-geo"
              placeholder="Enter your gamer name"
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-geo btn-geo-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-geo btn-geo-teal"
            >
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
