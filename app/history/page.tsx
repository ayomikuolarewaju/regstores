'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {supabase} from '../lib/supabase'

export default function HistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'present' | 'late'>('all')
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    late: 0
  })

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .order('marked_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setRecords(data || [])
      setStats({
        total: data?.length || 0,
        present: data?.filter(r => r.status === 'present').length || 0,
        late: data?.filter(r => r.status === 'late').length || 0
      })
    }

    setLoading(false)
  }

  const filteredRecords = records.filter(r => {
    if (filter === 'all') return true
    return r.status === filter
  })

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
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          My Attendance History
        </h2>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Total Days</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-gray-500 mt-1">On Time</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{stats.late}</p>
            <p className="text-xs text-gray-500 mt-1">Late</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'present', 'late'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Records list */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            Loading...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">No attendance records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map(record => (
              <div
                key={record.id}
                className="bg-white rounded-2xl shadow p-4"
              >
                {/* Date and status */}
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {new Date(record.marked_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.marked_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    record.status === 'present'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {record.status}
                  </span>
                </div>

                {/* Location */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                  <div className="flex items-start gap-2 text-sm">
                    <span>📍</span>
                    <span className="text-gray-600 text-xs">
                      {record.location_name?.split(',').slice(0, 3).join(',') || 'Location not available'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>🌐</span>
                    <span className="text-gray-500 text-xs">
                      {record.latitude.toFixed(6)}, {record.longitude.toFixed(6)}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}