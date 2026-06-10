'use client'

import { useState } from 'react'
import { signIn, signInWithGoogle } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignIn(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signIn(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    const result = await signInWithGoogle()
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.url) {
      window.location.href = result.url
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* Logo Header */}
      <div className="flex items-center gap-2 mb-8 select-none">
        <div className="relative">
          <div className="absolute -inset-1.5 bg-purple-500/40 rounded-full blur-md opacity-75 animate-pulse" />
          <div className="relative w-8 h-8 rounded-full border border-purple-400/30 bg-purple-950/40 flex items-center justify-center text-purple-400">
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
          </div>
        </div>
        <span className="text-lg font-bold tracking-tight text-white">
          <span className="text-purple-400 font-extrabold">AI SEO</span> Tracker
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full bg-[#0b0813]/70 border border-purple-500/15 rounded-2xl p-8 shadow-[0_0_50px_-12px_rgba(139,92,246,0.25)] backdrop-blur-xl flex flex-col transition-all duration-300 hover:border-purple-500/20">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome back</h1>
          <p className="text-sm text-gray-400">Log in to continue tracking your AI visibility.</p>
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#050508]/80 hover:bg-[#0c0c14]/90 border border-white/5 hover:border-white/10 rounded-xl text-white font-medium text-sm transition-all duration-300 shadow-inner cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative my-6 select-none">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0b0813] px-3 text-gray-500 font-medium">or</span>
          </div>
        </div>

        {/* Login Form */}
        <form action={handleSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-gray-400">Email address</label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-[#050508]/60 border border-white/10 focus:border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all duration-300 text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
                <div className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-gray-500">
                  •••
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-gray-400">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-[#050508]/60 border border-white/10 focus:border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all duration-300 text-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-semibold rounded-xl text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.45)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {loading ? 'Logging in…' : (
              <>
                Log in
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Terms */}
      <p className="text-[10px] text-gray-500 text-center mt-6 select-none opacity-60">
        By continuing, you agree to our{' '}
        <a href="/terms" className="hover:underline hover:text-gray-400 transition-colors">
          Terms
        </a>{' '}
        and{' '}
        <a href="/privacy" className="hover:underline hover:text-gray-400 transition-colors">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  )
}
