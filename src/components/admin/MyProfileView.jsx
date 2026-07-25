import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toast } from './AdminPage';

export default function MyProfileView({ dark }) {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    role: '',
    phone: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // In a real app, we would fetch the specific logged-in user. 
    // Here we will just fetch the first user or mock it.
    const fetchProfile = async () => {
      try {
        const res = await axios.get('https://school-backend-70ny.onrender.com/api/users');
        if (res.data.users && res.data.users.length > 0) {
          const u = res.data.users[0]; // mock current user
          setProfile({
            username: u.username || '',
            email: u.email || '',
            role: u.role || '',
            phone: u.phone || '+1 555-0198',
            bio: u.bio || 'Administrator at ERPzo Academy'
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Mock save delay
    setTimeout(() => {
      setSaving(false);
      setToast({ message: 'Profile updated successfully', type: 'success' });
    }, 800);
  };

  const getInitials = (name) => {
    return (name || 'Admin').substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <div className="p-10 text-center opacity-70">Loading profile...</div>;
  }

  return (
    <div className={`p-5 lg:p-10 flex-1 space-y-6 animate-fadeIn ${dark ? 'bg-[#1a1c1e] text-white' : 'bg-background text-on-surface'}`}>
      {/* Header */}
      <div className="mb-8">
        <nav className={`flex items-center gap-2 text-label-sm mb-2 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>
          <span>Admin Portal</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>My Profile</span>
        </nav>
        <h2 className={`text-xl lg:text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>My Profile</h2>
        <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>Manage your personal information and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Avatar & Quick Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-6 rounded-[24px] shadow-sm flex flex-col items-center text-center ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
            <div className="relative mb-4 group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface bg-gradient-to-br from-primary to-[#00897b] flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {getInitials(profile.username)}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#00c2a8] text-[#00493e] rounded-full shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                <span className="material-symbols-outlined !text-[18px]">photo_camera</span>
              </button>
            </div>
            <h3 className={`text-xl font-bold ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>{profile.username || 'Admin User'}</h3>
            <p className={`text-sm mt-1 mb-4 ${dark ? 'text-[#bbcac4]' : 'text-outline'}`}>{profile.role || 'Administrator'}</p>
            
            <div className={`w-full p-4 rounded-xl text-left space-y-3 ${dark ? 'bg-[#1a1c1e]' : 'bg-[#f9f9fc]'}`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline">email</span>
                <span className="text-sm font-medium">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline">phone</span>
                <span className="text-sm font-medium">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline">location_on</span>
                <span className="text-sm font-medium">New York, USA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-8">
          <div className={`p-8 rounded-[24px] shadow-sm ${dark ? 'bg-[#2f3133]' : 'bg-white'}`}>
            <h3 className={`text-lg font-bold mb-6 ${dark ? 'text-white' : 'text-[#1a1c1e]'}`}>Personal Information</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-semibold mb-2 uppercase tracking-wider text-outline">Full Name</label>
                  <input 
                    type="text" 
                    value={profile.username} 
                    onChange={e => setProfile({...profile, username: e.target.value})} 
                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-2 uppercase tracking-wider text-outline">Email Address</label>
                  <input 
                    type="email" 
                    value={profile.email} 
                    onChange={e => setProfile({...profile, email: e.target.value})} 
                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-2 uppercase tracking-wider text-outline">Phone Number</label>
                  <input 
                    type="text" 
                    value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})} 
                    className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-2 uppercase tracking-wider text-outline">Role</label>
                  <input 
                    type="text" 
                    value={profile.role} 
                    disabled
                    className={`w-full p-3 rounded-xl border transition-all text-sm cursor-not-allowed ${dark ? 'bg-[#1a1c1e]/50 border-[#3c4a46]/50 text-outline' : 'bg-[#f3f3f6] border-outline-variant/50 text-outline'}`} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold mb-2 uppercase tracking-wider text-outline">Bio</label>
                <textarea 
                  rows="4"
                  value={profile.bio} 
                  onChange={e => setProfile({...profile, bio: e.target.value})} 
                  className={`w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary transition-all text-sm resize-none ${dark ? 'bg-[#1a1c1e] border-[#3c4a46] text-white' : 'bg-surface border-outline-variant text-[#1a1c1e]'}`} 
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant/30">
                <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl text-sm font-semibold bg-[#006b5c] text-white hover:brightness-110 transition-colors shadow-md flex items-center gap-2">
                  {saving ? (
                    <><span className="material-symbols-outlined animate-spin !text-[18px]">sync</span> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
