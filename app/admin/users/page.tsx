'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabase'


export default function ManageUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchName, setSearchName] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [userAttendance, setUserAttendance] = useState<any[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  useEffect(() => {
    checkAdmin()
    fetchUsers()
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

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        attendance (count)
      `)
      .eq('role', 'user')
      .order('created_at', { ascending: false })

    if (!error) setUsers(data || [])
    setLoading(false)
  }

  const fetchUserAttendance = async (user: any) => {
    setSelectedUser(user)
    setAttendanceLoading(true)

    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .order('marked_at', { ascending: false })
      .limit(10)

    setUserAttendance(data || [])
    setAttendanceLoading(false)
  }

  const promoteToAdmin = async (userId: string) => {
    setActionLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)

    if (!error) {
      setMessage('User promoted to admin successfully!')
      fetchUsers()
    } else {
      setMessage('Failed to promote user.')
    }
    setActionLoading(null)
    setTimeout(() => setMessage(''), 3000)
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    setActionLoading(userId)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (!error) {
      setMessage('User deleted successfully!')
      setUsers(prev => prev.filter(u => u.id !== userId))
      if (selectedUser?.id === userId) setSelectedUser(null)
    } else {
      setMessage('Failed to delete user.')
    }
    setActionLoading(null)
    setTimeout(() => setMessage(''), 3000)
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchName.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchName.toLowerCase())
  )

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
            onClick={() => router.push('/admin')}
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Attendance
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
          Manage Users
        </h2>

        {/* Success / error message */}
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            message.includes('success')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}>
            {message}
          </div>
        )}

        <div className="flex gap-6">

          {/* Users list */}
          <div className="flex-1">

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow p-4 mb-4 flex gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => {
                    const count = u.attendance?.[0]?.count || 0
                    return count > 0
                  }).length}
                </p>
                <p className="text-xs text-gray-500">Active Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">
                  {users.filter(u => {
                    const count = u.attendance?.[0]?.count || 0
                    return count === 0
                  }).length}
                </p>
                <p className="text-xs text-gray-500">Never Checked In</p>
              </div>
            </div>

            {/* Users cards */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">👥</p>
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`bg-white rounded-2xl shadow p-4 cursor-pointer transition border-2 ${
                      selectedUser?.id === user.id
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-gray-200'
                    }`}
                    onClick={() => fetchUserAttendance(user)}
                  >
                    <div className="flex justify-between items-start">

                      {/* User info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {user.full_name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Joined {new Date(user.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 items-end">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                          {user.attendance?.[0]?.count || 0} check-ins
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              promoteToAdmin(user.id)
                            }}
                            disabled={actionLoading === user.id}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg hover:bg-purple-200 transition disabled:opacity-50"
                          >
                            {actionLoading === user.id ? '...' : '⬆️ Make Admin'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteUser(user.id)
                            }}
                            disabled={actionLoading === user.id}
                            className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                          >
                            {actionLoading === user.id ? '...' : '🗑️ Delete'}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User attendance sidebar */}
          {selectedUser && (
            <div className="w-80 bg-white rounded-2xl shadow p-5 h-fit sticky top-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedUser.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{selectedUser.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Recent Attendance
              </h3>

              {attendanceLoading ? (
                <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
              ) : userAttendance.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">
                  No attendance records yet
                </p>
              ) : (
                <div className="space-y-2">
                  {userAttendance.map(record => (
                    <div
                      key={record.id}
                      className="bg-gray-50 rounded-xl p-3"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {new Date(record.marked_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(record.marked_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${
                          record.status === 'present'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        📍 {record.location_name?.split(',').slice(0, 2).join(',') || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setSelectedUser(null)}
                className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}