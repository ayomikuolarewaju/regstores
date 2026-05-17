'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {supabase} from '../lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [marked, setMarked] = useState(false)
  const [error, setError] = useState('')
  const [todayRecord, setTodayRecord] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchProfile()
    checkTodayAttendance()

    // Live clock
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data)
  }

  const checkTodayAttendance = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (data) {
      setTodayRecord(data)
      setMarked(true)
    }
  }

  const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
      }
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })
  }

  const markAttendance = async () => {
    setError('')
    setLoading(true)

    try {
      // Get location
      const position = await getLocation()
      const { latitude, longitude } = position.coords

      // Get location name from coordinates
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      )
      const geoData = await geoRes.json()
      const locationName = geoData.display_name || 'Unknown location'

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Determine status (late if after 9am)
      const hour = new Date().getHours()
      const status = hour >= 9 ? 'late' : 'present'

      // Save to database
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          latitude,
          longitude,
          location_name: locationName,
          status
        })
        .select()
        .single()

      if (error) throw error

      setTodayRecord(data)
      setMarked(true)

    } catch (err: any) {
      if (err.code === 1) {
        setError('Location permission denied. Please allow location access.')
      } else {
        setError(err.message || 'Something went wrong')
      }
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Attendance App</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => router.push('/history')}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            My History
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome, {profile?.full_name} 👋
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Live clock */}
        <div className="bg-blue-600 text-white rounded-2xl p-6 text-center mb-6 shadow">
          <p className="text-sm uppercase tracking-widest mb-1 opacity-80">
            Current Time
          </p>
          <p className="text-5xl font-bold tracking-tight">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>

        {/* Attendance card */}
        <div className="bg-white rounded-2xl shadow p-6">
          {marked && todayRecord ? (
            <div className="text-center">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                Attendance Marked!
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                You already checked in today
              </p>

              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">
                    {new Date(todayRecord.marked_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-semibold capitalize ${
                    todayRecord.status === 'present'
                      ? 'text-green-600'
                      : 'text-orange-500'
                  }`}>
                    {todayRecord.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-right max-w-xs text-xs text-gray-600">
                    {todayRecord.location_name?.split(',').slice(0, 2).join(',')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coordinates</span>
                  <span className="font-medium text-xs">
                    {todayRecord.latitude.toFixed(4)}, {todayRecord.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-3">📍</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                Mark Your Attendance
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Your location, date and time will be recorded
              </p>

              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}

              <button
                onClick={markAttendance}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? '📡 Getting location...' : '✅ Mark Attendance'}
              </button>

              <p className="text-xs text-gray-400 mt-3">
                You can only mark attendance once per day
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}