'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {supabase} from '@/app/lib/supabase'

export default function AdminDashboard() {
  const router = useRouter()
  const [records, setRecords] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'present' | 'late'>('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [searchName, setSearchName] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    todayPresent: 0,
    todayLate: 0,
    todayAbsent: 0
  })

  useEffect(() => {
    checkAdmin()
    fetchData()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }

  const fetchData = async () => {
    // Fetch all attendance with user profiles
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .order('marked_at', { ascending: false })

    // Fetch all users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'user')

    const today = new Date().toISOString().split('T')[0]
    const todayRecords = attendanceData?.filter(r => r.date === today) || []
    const totalUsers = usersData?.length || 0
    const todayPresent = todayRecords.filter(r => r.status === 'present').length
    const todayLate = todayRecords.filter(r => r.status === 'late').length
    const todayAbsent = totalUsers - (todayPresent + todayLate)

    setRecords(attendanceData || [])
    setUsers(usersData || [])
    setStats({
      totalUsers,
      todayPresent,
      todayLate,
      todayAbsent: todayAbsent < 0 ? 0 : todayAbsent
    })

    setLoading(false)
  }

  const filteredRecords = records.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter
    const matchDate = selectedDate ? r.date === selectedDate : true
    const matchName = searchName
      ? r.profiles?.full_name?.toLowerCase().includes(searchName.toLowerCase())
      : true
    return matchStatus && matchDate && matchName
  })

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Date', 'Time', 'Status', 'Location', 'Latitude', 'Longitude']
    const rows = filteredRecords.map(r => [
      r.profiles?.full_name,
      r.profiles?.email,
      r.date,
      new Date(r.marked_at).toLocaleTimeString(),
      r.status,
      r.location_name?.split(',').slice(0, 2).join(','),
      r.latitude,
      r.longitude
    ])

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${new Date().toLocaleDateString()}.csv`
    a.click()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Admin Dashboard</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => router.push('/admin/users')}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Manage Users
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Attendance Overview
        </h2>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-1">Total Users</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.todayPresent}</p>
            <p className="text-xs text-gray-500 mt-1">Present Today</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{stats.todayLate}</p>
            <p className="text-xs text-gray-500 mt-1">Late Today</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{stats.todayAbsent}</p>
            <p className="text-xs text-gray-500 mt-1">Absent Today</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">

            {/* Search by name */}
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Date filter */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Status filter */}
            <div className="flex gap-2">
              {(['all', 'present', 'late'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={exportCSV}
              className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              📥 Export CSV
            </button>

          </div>
        </div>

        {/* Records table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">No records found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Email</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Time</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {record.profiles?.full_name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {record.profiles?.email}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(record.marked_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(record.marked_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                        {record.location_name?.split(',').slice(0, 2).join(',') || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
