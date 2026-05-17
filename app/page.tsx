'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const router = useRouter()
  const [time, setTime] = useState(new Date())
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const theme = {
    bg: dark ? 'bg-[#0a0f1e]' : 'bg-gray-50',
    text: dark ? 'text-white' : 'text-gray-900',
    subtext: dark ? 'text-gray-400' : 'text-gray-500',
    nav: dark ? 'bg-transparent' : 'bg-white shadow-sm',
    card: dark
      ? 'bg-white/5 border-white/10 hover:bg-white/10'
      : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm',
    badge: dark
      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      : 'bg-blue-50 border-blue-200 text-blue-600',
    loginBtn: dark
      ? 'text-blue-400 border-blue-400 hover:text-white hover:border-white'
      : 'text-blue-600 border-blue-600 hover:text-blue-800 hover:border-blue-800',
    outlineBtn: dark
      ? 'border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white'
      : 'border-gray-300 hover:border-gray-500 text-gray-600 hover:text-gray-900',
    footer: dark ? 'text-gray-600' : 'text-gray-400',
    toggleBg: dark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300',
    toggleText: dark ? 'text-white' : 'text-gray-700',
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} overflow-hidden relative transition-colors duration-300`}>

      {/* Background grid - only in dark mode */}
      {dark && (
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      )}

      {/* Glow - only in dark mode */}
      {dark && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600 opacity-10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Navbar */}
      <nav className={`relative z-10 flex justify-between items-center px-8 py-6 ${theme.nav} transition-colors duration-300`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-bold text-lg tracking-tight">AttendanceApp</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            className={`${theme.toggleBg} ${theme.toggleText} px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2`}
          >
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>

          <button
            onClick={() => router.push('/login')}
            className={`text-sm border px-4 py-2 rounded-lg transition ${theme.loginBtn}`}
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-32">

        {/* Live clock badge */}
        <div className={`mb-6 inline-flex items-center gap-2 border px-4 py-2 rounded-full text-sm ${theme.badge} transition-colors duration-300`}>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
          {' · '}
          {time.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          Track Attendance
          <br />
          <span className="text-blue-400">Smarter.</span>
        </h1>

        <p className={`text-lg md:text-xl max-w-xl mb-10 leading-relaxed ${theme.subtext}`}>
          Mark your attendance in one tap. Your location, time, and date are
          automatically recorded — no paperwork needed.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg shadow-blue-600/30"
          >
            Get Started →
          </button>
          <button
            onClick={() => router.push('/login')}
            className={`border px-8 py-4 rounded-xl font-semibold text-lg transition ${theme.outlineBtn}`}
          >
            Login
          </button>
        </div>

      </div>

      {/* Features */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {[
            {
              icon: '📍',
              title: 'Location Tracking',
              desc: 'Automatically captures your GPS coordinates when you mark attendance. No manual entry needed.'
            },
            {
              icon: '⏰',
              title: 'Time & Date Stamp',
              desc: 'Every check-in is timestamped precisely. Late arrivals are flagged automatically.'
            },
            {
              icon: '📊',
              title: 'Admin Dashboard',
              desc: 'Managers get a full overview of all attendance records with filters and CSV export.'
            }
          ].map(feature => (
            <div
              key={feature.title}
              className={`border rounded-2xl p-6 transition-colors duration-300 ${theme.card}`}
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className={`text-sm leading-relaxed ${theme.subtext}`}>
                {feature.desc}
              </p>
            </div>
          ))}

        </div>
      </div>

      {/* Footer */}
      <div className={`relative z-10 text-center pb-10 text-sm ${theme.footer}`}>
        Built with Next.js & Supabase
      </div>

    </div>
  )
}