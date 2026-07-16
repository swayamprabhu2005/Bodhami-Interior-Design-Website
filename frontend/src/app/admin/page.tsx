'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { adminAPI } from '@/lib/api'
import Navbar from '@/components/Navbar'
import toast from 'react-hot-toast'
import Link from 'next/link'
import clsx from 'clsx'
import {
  Users, Home, FileText, MessageCircle, TrendingUp,
  BarChart3, CheckCircle2, Clock, AlertCircle, Building2,
  ArrowUpRight, RefreshCw, Star
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft:   'bg-slate-100 text-slate-600',
  quoted:  'bg-amber-100 text-amber-700',
  ordered: 'bg-blue-100 text-blue-700',
  done:    'bg-green-100 text-green-700',
}
const INQ_COLORS: Record<string, string> = {
  new:       'bg-rose-100 text-rose-700',
  contacted: 'bg-amber-100 text-amber-700',
  converted: 'bg-green-100 text-green-700',
}

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [tab, setTab] = useState<'overview' | 'projects' | 'inquiries' | 'users'>('overview')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [statsRes, projRes, inqRes, usersRes] = await Promise.all([
        adminAPI.stats(),
        adminAPI.projects(),
        adminAPI.inquiries(),
        adminAPI.users(),
      ])
      setStats(statsRes.data)
      setProjects(projRes.data.projects || [])
      setInquiries(inqRes.data.inquiries || [])
      setUsers(usersRes.data.users || [])
    } catch {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const updateProjectStatus = async (id: string, status: string) => {
    try {
      await adminAPI.updateProjectStatus(id, status)
      toast.success('Status updated')
      load()
    } catch {
      toast.error('Failed to update')
    }
  }

  const updateInquiry = async (id: string, status: string) => {
    try {
      await adminAPI.updateInquiry(id, { status })
      toast.success('Inquiry updated')
      load()
    } catch {
      toast.error('Failed to update inquiry')
    }
  }

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(n)

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Platform operations and analytics</p>
          </div>
          <button onClick={load} className="btn-ghost gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-1 shadow-card w-fit">
          {(['overview', 'projects', 'inquiries', 'users'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all',
                tab === t
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl shimmer" />)}
          </div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {tab === 'overview' && stats && (
              <div className="space-y-8">
                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { icon: Users,       label: 'Total Users',     value: stats.total_users,      color: 'text-indigo-600 bg-indigo-50' },
                    { icon: Home,        label: 'Projects',        value: stats.total_projects,   color: 'text-blue-600 bg-blue-50' },
                    { icon: FileText,    label: 'Quotations',      value: stats.total_quotations, color: 'text-amber-600 bg-amber-50' },
                    { icon: MessageCircle, label: 'Inquiries',     value: stats.total_inquiries,  color: 'text-rose-600 bg-rose-50' },
                    { icon: Building2,   label: 'Vendors',         value: stats.total_vendors,    color: 'text-emerald-600 bg-emerald-50' },
                    { icon: TrendingUp,  label: 'Pipeline',        value: formatINR(stats.revenue_pipeline), color: 'text-purple-600 bg-purple-50' },
                  ].map((kpi, i) => (
                    <motion.div
                      key={kpi.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-white rounded-2xl p-5 shadow-card"
                    >
                      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', kpi.color)}>
                        <kpi.icon className="w-5 h-5" />
                      </div>
                      <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{kpi.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Status Breakdown */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-card">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Home className="w-4 h-4 text-indigo-600" /> Projects by Status
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(stats.projects_by_status || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className={clsx('badge capitalize', STATUS_COLORS[status] || 'bg-slate-100 text-slate-600')}>{status}</span>
                          <span className="font-bold text-slate-800">{count as number}</span>
                        </div>
                      ))}
                      {Object.keys(stats.projects_by_status || {}).length === 0 && (
                        <p className="text-slate-400 text-sm">No projects yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-card">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-rose-500" /> Inquiries by Status
                    </h3>
                    <div className="space-y-3">
                      {Object.entries(stats.inquiries_by_status || {}).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className={clsx('badge capitalize', INQ_COLORS[status] || 'bg-slate-100 text-slate-600')}>{status}</span>
                          <span className="font-bold text-slate-800">{count as number}</span>
                        </div>
                      ))}
                      {Object.keys(stats.inquiries_by_status || {}).length === 0 && (
                        <p className="text-slate-400 text-sm">No inquiries yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PROJECTS ── */}
            {tab === 'projects' && (
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">All Projects ({projects.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full admin-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Property</th>
                        <th>BHK</th>
                        <th>City</th>
                        <th>Budget</th>
                        <th>Package</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div className="font-medium text-slate-800">{p.customer_name || '—'}</div>
                            <div className="text-xs text-slate-400">{p.customer_phone}</div>
                          </td>
                          <td className="font-medium text-slate-800">{p.property_name}</td>
                          <td><span className="badge bg-slate-100 text-slate-600">{p.bhk_type}</span></td>
                          <td className="text-slate-500">{p.city}</td>
                          <td className="font-semibold text-indigo-600">₹{(p.budget/100000).toFixed(1)}L</td>
                          <td>
                            {p.package_name
                              ? <span className={clsx('badge capitalize', p.package_tier === 'luxury' ? 'bg-indigo-100 text-indigo-700' : p.package_tier === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                                  {p.package_tier} / {p.package_name}
                                </span>
                              : <span className="text-slate-400 text-xs">—</span>
                            }
                          </td>
                          <td>
                            <select
                              value={p.status}
                              onChange={(e) => updateProjectStatus(p.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                              {['draft','quoted','ordered','done'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td>
                            <Link href={`/track/${p.id}`} className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                              Track <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {projects.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-12 text-slate-400">No projects found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── INQUIRIES ── */}
            {tab === 'inquiries' && (
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">All Inquiries ({inquiries.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Contact</th>
                        <th>BHK</th>
                        <th>City</th>
                        <th>Message</th>
                        <th>Source</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((inq) => (
                        <tr key={inq.id}>
                          <td className="font-medium text-slate-800">{inq.name}</td>
                          <td>
                            <div className="text-slate-600">{inq.phone}</div>
                            <div className="text-xs text-slate-400">{inq.email}</div>
                          </td>
                          <td>{inq.bhk_type || '—'}</td>
                          <td>{inq.city || '—'}</td>
                          <td className="max-w-xs">
                            <p className="text-slate-500 text-xs truncate">{inq.message || '—'}</p>
                          </td>
                          <td><span className="badge bg-slate-100 text-slate-600 capitalize">{inq.source}</span></td>
                          <td className="text-xs text-slate-400">
                            {inq.created_at ? new Date(inq.created_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td>
                            <select
                              value={inq.status}
                              onChange={(e) => updateInquiry(inq.id, e.target.value)}
                              className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                              {['new','contacted','converted'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {inquiries.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-12 text-slate-400">No inquiries yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && (
              <div className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900">All Users ({users.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>City</th>
                        <th>Projects</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td className="font-medium text-slate-800">{u.name}</td>
                          <td className="text-slate-600">{u.phone || '—'}</td>
                          <td className="text-slate-600 text-xs">{u.email || '—'}</td>
                          <td>{u.city || '—'}</td>
                          <td>
                            <span className="badge bg-indigo-50 text-indigo-700">{u.project_count} projects</span>
                          </td>
                          <td className="text-xs text-slate-400">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '—'}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-12 text-slate-400">No users found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
