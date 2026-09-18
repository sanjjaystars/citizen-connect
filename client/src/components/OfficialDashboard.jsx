import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Shield,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Filter,
  Search,
  MapPin,
  Phone,
  User,
  Edit3,
  BarChart3,
  Layers,
  ArrowUpDown,
  RefreshCw,
  X,
  Check,
  Calendar,
  Eye,
} from 'lucide-react';

const SEVERITY_COLORS = {
  High: 'bg-rose-100 text-rose-800 border-rose-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function OfficialDashboard() {
  const { user, quickLogin } = useAuth();
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('date'); // 'date' | 'upvotes' | 'severity'

  // Selected post for detail / status update modal
  const [activeModalPost, setActiveModalPost] = useState(null);
  const [newStatus, setNewStatus] = useState('In Progress');
  const [officialNote, setOfficialNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Active view tab: 'table' | 'cards' | 'analytics'
  const [viewMode, setViewMode] = useState('table');

  const municipalityId = user?.municipality_id || 1;
  const municipalityName = user?.municipality_name || (municipalityId === 2 ? 'Coimbatore City Municipal Corporation' : 'Greater Chennai Corporation');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        municipality_id: municipalityId,
        sort: sortField,
      };
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedSeverity !== 'All') params.severity = selectedSeverity;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [postsRes, analyticsRes] = await Promise.all([
        api.getOfficialPosts(params),
        api.getAnalytics(municipalityId),
      ]);

      if (postsRes.posts) setPosts(postsRes.posts);
      if (analyticsRes) setAnalytics(analyticsRes);
    } catch (err) {
      console.error('Failed to load official dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [municipalityId, selectedStatus, selectedCategory, selectedSeverity, sortField]);

  const handleOpenStatusModal = (post) => {
    setActiveModalPost(post);
    setNewStatus(post.status === 'Received' ? 'In Progress' : post.status);
    setOfficialNote(post.official_notes || '');
    setUpdateSuccess('');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!activeModalPost) return;

    setIsUpdating(true);
    try {
      const res = await api.updatePostStatus(activeModalPost.id, {
        status: newStatus,
        official_notes: officialNote,
      });

      setUpdateSuccess(`Status updated to "${newStatus}"!`);
      // Update local post state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activeModalPost.id ? { ...p, status: newStatus, official_notes: officialNote } : p
        )
      );

      // Refresh analytics
      api.getAnalytics(municipalityId).then(setAnalytics).catch(console.warn);

      setTimeout(() => {
        setActiveModalPost(null);
      }, 1000);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Official Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Municipal Administration Officer Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {municipalityName}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 flex items-center gap-2">
              <span>Logged in as: <strong className="text-white">{user?.name || 'Officer'}</strong> ({user?.phone})</span>
            </p>
          </div>

          {/* Quick Municipality Jurisdiction Switcher for Evaluator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => quickLogin('official-chennai')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                municipalityId === 1
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
              }`}
            >
              Greater Chennai
            </button>
            <button
              onClick={() => quickLogin('official-coimbatore')}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                municipalityId === 2
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                  : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
              }`}
            >
              Coimbatore Corp
            </button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        {analytics?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Issues</span>
              <span className="text-2xl sm:text-3xl font-black text-white mt-0.5 block">
                {analytics.summary.total_issues || 0}
              </span>
            </div>
            <div className="bg-white/5 border border-sky-500/20 rounded-2xl p-4 backdrop-blur-md">
              <span className="text-[11px] uppercase font-bold text-sky-400 block">Pending / Received</span>
              <span className="text-2xl sm:text-3xl font-black text-sky-300 mt-0.5 block">
                {analytics.summary.count_received || 0}
              </span>
            </div>
            <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-md">
              <span className="text-[11px] uppercase font-bold text-amber-400 block">In Progress</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5 block">
                {analytics.summary.count_in_progress || 0}
              </span>
            </div>
            <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-4 backdrop-blur-md">
              <span className="text-[11px] uppercase font-bold text-emerald-400 block">Resolved</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-300 mt-0.5 block">
                {analytics.summary.count_resolved || 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: View Switcher, Filters & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* View Mode Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'cards' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Cards View
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'analytics' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Resolution Analytics
            </button>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                placeholder="Search description, citizen name, phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              onClick={fetchData}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase font-bold">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase font-bold">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              <option value="All">All Categories</option>
              <option value="Road">Road</option>
              <option value="Water">Water</option>
              <option value="Electricity">Electricity</option>
              <option value="Garbage">Garbage</option>
              <option value="Drainage">Drainage</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] uppercase font-bold">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              <option value="All">All Severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400 text-[11px] uppercase font-bold">Sort By:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
            >
              <option value="date">Date (Newest)</option>
              <option value="upvotes">Most Upvotes</option>
              <option value="severity">Highest Severity</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500 font-semibold">
          Loading municipality records...
        </div>
      ) : viewMode === 'analytics' ? (
        /* Analytics View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Issues By Category (Open vs Resolved)
              </h3>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {analytics?.categories?.map((cat) => {
                const total = parseInt(cat.total || 0, 10);
                const resolved = parseInt(cat.resolved || 0, 10);
                const open = parseInt(cat.open || 0, 10);
                const pctResolved = total > 0 ? Math.round((resolved / total) * 100) : 0;

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{cat.category}</span>
                      <span className="text-slate-500">
                        {resolved} Resolved / {open} Open ({pctResolved}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                      <div
                        style={{ width: `${pctResolved}%` }}
                        className="bg-emerald-500 h-full transition-all"
                      />
                      <div
                        style={{ width: `${100 - pctResolved}%` }}
                        className="bg-amber-400 h-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ward Distribution */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Ward Grievance Volume & Resolution
              </h3>
              <Building className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-3">
              {analytics?.wards?.map((ward) => {
                const total = parseInt(ward.total || 0, 10);
                const resolved = parseInt(ward.resolved || 0, 10);
                return (
                  <div key={ward.ward_name} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{ward.ward_name}</div>
                      <div className="text-[11px] text-slate-500">
                        Total complaints logged: {total}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {resolved} Closed
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Actionable Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">ID & Photo</th>
                  <th className="py-3.5 px-4">Category & Department</th>
                  <th className="py-3.5 px-4">Description & Location</th>
                  <th className="py-3.5 px-4">Citizen Contact</th>
                  <th className="py-3.5 px-4">Upvotes</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.photo_url}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <span className="font-mono font-bold text-slate-400">#{p.id}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.category}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {p.department_name || 'Municipal Works'}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-slate-800 line-clamp-2">{p.description}</p>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{p.ward_name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{p.citizen_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.citizen_phone}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        👍 {p.upvotes_count}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                          SEVERITY_COLORS[p.severity] || SEVERITY_COLORS.Medium
                        }`}
                      >
                        {p.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'In Progress'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.official_notes && (
                        <div className="text-[10px] text-slate-500 mt-1 max-w-[150px] truncate" title={p.official_notes}>
                          Note: {p.official_notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenStatusModal(p)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {p.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      SEVERITY_COLORS[p.severity] || SEVERITY_COLORS.Medium
                    }`}
                  >
                    {p.severity} Priority
                  </span>
                </div>

                <img
                  src={p.photo_url}
                  alt=""
                  className="w-full h-40 rounded-xl object-cover border border-slate-200"
                />

                <p className="mt-2 text-xs font-semibold text-slate-800 line-clamp-2">
                  {p.description}
                </p>

                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>📍 {p.ward_name}</span>
                  <span className="font-bold text-emerald-700">👍 {p.upvotes_count} upvotes</span>
                </div>

                {p.official_notes && (
                  <div className="mt-2 p-2 bg-sky-50 rounded-lg text-[11px] text-sky-900 border border-sky-200">
                    <strong>Official Note:</strong> {p.official_notes}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${
                    p.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : p.status === 'In Progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-sky-100 text-sky-800'
                  }`}
                >
                  {p.status}
                </span>

                <button
                  onClick={() => handleOpenStatusModal(p)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Change Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Official Status Update Modal */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-800 to-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Update Complaint #{activeModalPost.id}</h3>
                <p className="text-xs text-indigo-200">{activeModalPost.category} • {activeModalPost.ward_name}</p>
              </div>
              <button
                onClick={() => setActiveModalPost(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-5 space-y-4">
              {updateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resolution Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Received', 'In Progress', 'Resolved'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                        newStatus === st
                          ? st === 'Resolved'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'In Progress'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Official Municipal Note (Visible to Citizens)
                </label>
                <textarea
                  rows={3}
                  value={officialNote}
                  onChange={(e) => setOfficialNote(e.target.value)}
                  placeholder="e.g. Patchwork crew deployed; asphalt repaving scheduled for 18th Sept..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This note immediately syncs to the citizen's social feed and upvoters.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModalPost(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  {isUpdating ? 'Saving...' : 'Save & Publish Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
