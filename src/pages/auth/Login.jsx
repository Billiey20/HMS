import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LocalHospital, Visibility, VisibilityOff } from '@mui/icons-material';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 p-12 text-white relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-8 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <LocalHospital className="text-white" sx={{ fontSize: 28 }} />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase">Biopassion</p>
              <p className="text-lg font-black leading-none">Diagnostics</p>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-black leading-tight mb-4">
              Hospital<br />Management<br />System
            </h1>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <LocalHospital className="text-white" sx={{ fontSize: 22 }} />
            </div>
            <div>
              <p className="text-xs font-bold text-primary-600 tracking-widest uppercase">Biopassion</p>
              <p className="text-sm font-black text-slate-800">Hospital Management System</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-1">Sign In</h2>
          <p className="text-sm text-slate-500 mb-8">Enter your credentials to log in.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                id="hms-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@hospital.com"
                className="input"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  id="hms-password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              id="hms-login-btn"
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 rounded-xl text-base mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            © 2026 Biopassion Diagnostics Ltd. · Level 4 HMS v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
