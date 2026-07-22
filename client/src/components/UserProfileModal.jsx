import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Check, LogOut, ShieldCheck, User } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, avatars, updateUserProfile, loginWithGoogle, logoutUser } = useSocket();
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  useEffect(() => {
    setName(user.name);
    setSelectedAvatar(user.avatar);
  }, [user]);

  useEffect(() => {
    if (isOpen && GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback
        });

        const btnDiv = document.getElementById('googleSignInBtn');
        if (btnDiv) {
          window.google.accounts.id.renderButton(btnDiv, {
            theme: 'outline',
            size: 'large',
            width: '100%'
          });
        }
      } catch (e) {
        console.error('Google accounts SDK init error:', e);
      }
    }
  }, [isOpen, GOOGLE_CLIENT_ID]);

  // Decode JWT payload without heavy external libs
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleGoogleCallback = (response) => {
    if (response.credential) {
      loginWithGoogle({
        token: response.credential
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateUserProfile(name.trim(), selectedAvatar);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="card-geo bg-white w-full max-w-md p-6 relative animate-pop space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-[#FF5A5F] text-white border-[2px] border-[#1E1E24] shadow-[2px_2px_0px_#1E1E24] flex items-center justify-center font-bold hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-[#1E1E24] flex items-center gap-2">
            <span>🎨</span> Gamer Profile
          </h2>
          <p className="text-xs font-semibold text-[#5C5C66]">
            Log in with Google to sync your profile picture & stats across devices!
          </p>
        </div>

        {/* Google OAuth Section */}
        {user.isGoogle ? (
          <div className="card-geo bg-[#4EA8DE]/10 border-[2px] border-[#4EA8DE] p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-[2px] border-[#1E1E24] object-cover"
                />
              ) : (
                <span className="text-3xl">{user.avatar}</span>
              )}
              <div>
                <div className="font-['Fredoka'] font-bold text-sm text-[#1E1E24] flex items-center gap-1">
                  <span>{user.name}</span>
                  <ShieldCheck className="w-4 h-4 text-[#06D6A0]" />
                </div>
                <div className="text-xs text-[#5C5C66]">{user.email || 'Google Account'}</div>
              </div>
            </div>

            <button
              onClick={() => {
                logoutUser();
                onClose();
              }}
              className="btn-geo btn-geo-coral text-xs py-1.5 px-3"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {!GOOGLE_CLIENT_ID && (
              <div className="rounded-xl border-[2px] border-amber-300 bg-amber-50/50 p-3 space-y-2.5">
                <div className="flex gap-2">
                  <span className="text-lg">⚠️</span>
                  <div className="text-xs text-amber-800 leading-relaxed font-semibold">
                    <p className="font-bold mb-0.5">Google OAuth is not configured.</p>
                    <p>To enable real Google Sign-In, please set the <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">VITE_GOOGLE_CLIENT_ID</code> environment variable in your <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">client/.env</code> file.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    loginWithGoogle({
                      isSimulated: true,
                      googleUser: {
                        googleId: 'g_demo_' + Math.floor(100000 + Math.random() * 900000),
                        name: 'Yash Sushil (Dev Mode)',
                        email: 'yash.sushil16@gmail.com',
                        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
                      }
                    });
                    onClose();
                  }}
                  className="btn-geo btn-geo-white w-full py-2 text-xs flex justify-center items-center gap-2"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-3.5 h-3.5 opacity-60"
                  />
                  <span>Continue with Simulated Account (Dev Mode)</span>
                </button>
              </div>
            )}
            {GOOGLE_CLIENT_ID && (
              <div id="googleSignInBtn" className="w-full flex justify-center" />
            )}
          </div>
        )}

        <div className="border-t-[2px] border-gray-200 pt-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1E1E24] mb-1">
                Choose Guest Avatar Emoji
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
                className="btn-geo btn-geo-[#FF70A6]"
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
    </div>
  );
}
