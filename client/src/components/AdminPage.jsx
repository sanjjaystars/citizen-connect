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
  Columns,
  ThumbsUp,
  FileText,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import L from 'leaflet';

const SEVERITY_COLORS = {
  High: 'bg-rose-100 text-rose-800 border-rose-200',
  Medium: 'bg-amber-100 text-amber-800 border-amber-200',
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const CATEGORY_COLORS = {
  Road: 'bg-amber-50 text-amber-900 border-amber-200',
  Garbage: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  Water: 'bg-blue-50 text-blue-900 border-blue-200',
  Electricity: 'bg-purple-50 text-purple-900 border-purple-200',
  Drainage: 'bg-cyan-50 text-cyan-900 border-cyan-200',
  Other: 'bg-slate-50 text-slate-900 border-slate-200',
};

export default function AdminPage({ onSwitchToCitizen }) {
  const { user, quickLogin, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedWard, setSelectedWard] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('date'); // 'date' | 'upvotes' | 'severity'

  // View modes: 'table' | 'kanban' | 'analytics'
  const [viewMode, setViewMode] = useState('kanban');

  // Modal for issue inspection and status update
  const [activeModalPost, setActiveModalPost] = useState(null);
  const [newStatus, setNewStatus] = useState('In Progress');
  const [newDepartmentId, setNewDepartmentId] = useState('');
  const [officialNote, setOfficialNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  const isOfficial = user?.role === 'official';
  const municipalityId = user?.municipality_id || 1;
  const municipalityName =
    user?.municipality_name ||
    (municipalityId === 2
      ? 'Coimbatore City Municipal Corporation'
      : 'Greater Chennai Corporation');

  const fetchAdminData = async () => {
    if (!isOfficial) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = {
        municipality_id: municipalityId,
        sort: sortField,
      };
      if (selectedStatus !== 'All') params.status = selectedStatus;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedDepartment !== 'All') params.department_id = selectedDepartment;
      if (selectedSeverity !== 'All') params.severity = selectedSeverity;
      if (selectedWard !== 'All') params.ward_id = selectedWard;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const [postsRes, analyticsRes, deptsRes] = await Promise.all([
        api.getOfficialPosts(params),
        api.getAnalytics(municipalityId),
        api.getDepartments(municipalityId),
      ]);

      if (postsRes.posts) setPosts(postsRes.posts);
      if (analyticsRes) setAnalytics(analyticsRes);
      if (deptsRes.departments) setDepartments(deptsRes.departments);
    } catch (err) {
      console.error('Failed to load official dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [
    isOfficial,
    municipalityId,
    selectedStatus,
    selectedCategory,
    selectedDepartment,
    selectedSeverity,
    selectedWard,
    sortField,
  ]);

  const handleOpenStatusModal = (post) => {
    setActiveModalPost(post);
    setNewStatus(post.status === 'Received' ? 'In Progress' : post.status);
    setNewDepartmentId(post.department_id || '');
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
        department_id: newDepartmentId ? parseInt(newDepartmentId, 10) : undefined,
      });

      setUpdateSuccess(`Status updated to "${newStatus}" and notes synced to citizens!`);

      // Update local post state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activeModalPost.id
            ? {
                ...p,
                status: newStatus,
                official_notes: officialNote,
                department_id: newDepartmentId ? parseInt(newDepartmentId, 10) : p.department_id,
                department_name:
                  departments.find((d) => d.id === parseInt(newDepartmentId, 10))?.name ||
                  p.department_name,
              }
            : p
        )
      );

      // Refresh analytics
      api.getAnalytics(municipalityId).then(setAnalytics).catch(console.warn);

      setTimeout(() => {
        setActiveModalPost(null);
      }, 1100);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // IF NOT LOGGED IN AS AN OFFICIAL, SHOW DEDICATED OFFICIAL LOGIN PORTAL
  if (!isOfficial) {
    return (
      <div className="min-h-[85vh] bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mb-5 mx-auto">
            <Shield className="w-7 h-7" />
          </div>

          <div className="text-center space-y-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30">
              Restricted Access
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Municipality Agent Admin Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              This portal is reserved for municipal corporation engineers, ward inspectors, and department agents to inspect and resolve citizen complaints.
            </p>
          </div>

          {/* Quick 1-Click Agent Login Demo Buttons */}
          <div className="space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 mb-6">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              1-Click Municipality Agent Login (Demo)
            </div>

            <button
              onClick={() => quickLogin('official-chennai')}
              className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-indigo-950/80 border border-slate-700 hover:border-indigo-500 transition-all text-xs flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-white group-hover:text-indigo-300 text-sm">
                  Greater Chennai Corporation (GCC)
                </div>
                <div className="text-[11px] text-slate-400">
                  Officer Rajesh Kumar • Zone 8 (Anna Nagar, T. Nagar, Adyar)
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => quickLogin('official-coimbatore')}
              className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-indigo-950/80 border border-slate-700 hover:border-indigo-500 transition-all text-xs flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-white group-hover:text-indigo-300 text-sm">
                  Coimbatore City Municipal Corp (CCMC)
                </div>
                <div className="text-[11px] text-slate-400">
                  Officer Meena Sundaram • Central Zone (RS Puram, Gandhipuram)
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={onSwitchToCitizen}
              className="text-xs text-slate-400 hover:text-white transition-colors underline"
            >
              ← Return to Citizen Community Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GROUP POSTS FOR KANBAN VIEW
  const kanbanColumns = {
    Received: posts.filter((p) => p.status === 'Received'),
    'In Progress': posts.filter((p) => p.status === 'In Progress'),
    Resolved: posts.filter((p) => p.status === 'Resolved'),
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Municipal Executive Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/30">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  {municipalityName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Agent Console
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>Agent: <strong className="text-slate-200">{user?.name}</strong> ({user?.phone})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Corporation Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => quickLogin('official-chennai')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  municipalityId === 1
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Chennai GCC
              </button>
              <button
                onClick={() => quickLogin('official-coimbatore')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  municipalityId === 2
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Coimbatore CCMC
              </button>
            </div>

            <button
              onClick={onSwitchToCitizen}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5"
            >
              <span>Citizen View</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Performance Metric Tiles */}
        {analytics?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Issues Logged</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {analytics.summary.total_issues || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Across all corporation wards</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-2xs">
              <span className="text-[11px] uppercase font-bold text-sky-600 block">1. Received (New)</span>
              <div className="text-2xl sm:text-3xl font-black text-sky-700 mt-1">
                {analytics.summary.count_received || 0}
              </div>
              <span className="text-[10px] text-sky-600/80 mt-0.5 block">Awaiting field inspection</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] uppercase font-bold text-amber-600 block">2. In Progress</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
                {analytics.summary.count_in_progress || 0}
              </div>
              <span className="text-[10px] text-amber-600/80 mt-0.5 block">Crews dispatched on site</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-[11px] uppercase font-bold text-emerald-600 block">3. Resolved (Closed)</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                {analytics.summary.count_resolved || 0}
              </div>
              <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Work completed & verified</span>
            </div>

            <div className="bg-rose-50/90 p-4 rounded-2xl border border-rose-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] uppercase font-bold text-rose-700 block flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> High Severity
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-800 mt-1">
                {analytics.summary.count_high_priority || 0}
              </div>
              <span className="text-[10px] text-rose-600 mt-0.5 block">Immediate action required</span>
            </div>
          </div>
        )}

        {/* Action & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'kanban'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Kanban Pipeline
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Table View
              </button>

              <button
                onClick={() => setViewMode('analytics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'analytics'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                  onKeyDown={(e) => e.key === 'Enter' && fetchAdminData()}
                  placeholder="Search complaint text, citizen name, phone, street..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                onClick={fetchAdminData}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
                title="Refresh issues"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filtering Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-semibold">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase font-bold">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="All">All Categories</option>
                <option value="Road">Road</option>
                <option value="Water">Water</option>
                <option value="Electricity">Electricity</option>
                <option value="Garbage">Garbage</option>
                <option value="Drainage">Drainage</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase font-bold">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="All">All Severities</option>
                <option value="High">🚨 High Only</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Department Filter */}
            {departments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] uppercase font-bold">Department:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 max-w-[180px] truncate"
                >
                  <option value="All">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-400 text-[11px] uppercase font-bold">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
              >
                <option value="date">Newest Date</option>
                <option value="upvotes">🔥 Most Upvoted</option>
                <option value="severity">⚠️ Highest Severity</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN VIEWS */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading municipal complaints & routing data...</p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* KANBAN TRIAGE PIPELINE */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Column 1: Received */}
            <div className="bg-slate-200/70 rounded-2xl p-4 space-y-3 border border-slate-300/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <h3 className="font-bold text-sm text-slate-900">1. Received (Pending)</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800">
                  {kanbanColumns['Received'].length}
                </span>
              </div>

              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {kanbanColumns['Received'].map((post) => (
                  <KanbanCard
                    key={post.id}
                    post={post}
                    onOpenModal={() => handleOpenStatusModal(post)}
                  />
                ))}
                {kanbanColumns['Received'].length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500 italic bg-white/50 rounded-xl">
                    No new complaints pending review.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: In Progress */}
            <div className="bg-slate-200/70 rounded-2xl p-4 space-y-3 border border-slate-300/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900">2. In Progress (Dispatched)</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                  {kanbanColumns['In Progress'].length}
                </span>
              </div>

              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {kanbanColumns['In Progress'].map((post) => (
                  <KanbanCard
                    key={post.id}
                    post={post}
                    onOpenModal={() => handleOpenStatusModal(post)}
                  />
                ))}
                {kanbanColumns['In Progress'].length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500 italic bg-white/50 rounded-xl">
                    No complaints currently in progress.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Resolved */}
            <div className="bg-slate-200/70 rounded-2xl p-4 space-y-3 border border-slate-300/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-sm text-slate-900">3. Resolved (Closed)</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  {kanbanColumns['Resolved'].length}
                </span>
              </div>

              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {kanbanColumns['Resolved'].map((post) => (
                  <KanbanCard
                    key={post.id}
                    post={post}
                    onOpenModal={() => handleOpenStatusModal(post)}
                  />
                ))}
                {kanbanColumns['Resolved'].length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500 italic bg-white/50 rounded-xl">
                    No resolved complaints found in filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Category & Department</th>
                    <th className="py-3.5 px-4">Description & Location</th>
                    <th className="py-3.5 px-4">Citizen Contact</th>
                    <th className="py-3.5 px-4">Upvotes</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Status & Notes</th>
                    <th className="py-3.5 px-4 text-right">Agent Action</th>
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
                          <span className="font-mono font-bold text-slate-500">#{p.id}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.category}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {p.department_name || 'General Municipal Works'}
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
                        <a
                          href={`tel:${p.citizen_phone}`}
                          className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-mono mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{p.citizen_phone}</span>
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          👍 {p.upvotes_count}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
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
                          <div
                            className="text-[10px] text-slate-500 mt-1 max-w-[160px] truncate"
                            title={p.official_notes}
                          >
                            Note: {p.official_notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenStatusModal(p)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Resolve / Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ANALYTICS CHARTS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Issues By Category (Open vs Resolved)
                </h3>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-4">
                {analytics?.categories?.map((cat) => {
                  const total = parseInt(cat.total || 0, 10);
                  const resolved = parseInt(cat.resolved || 0, 10);
                  const open = parseInt(cat.open || 0, 10);
                  const pctResolved = total > 0 ? Math.round((resolved / total) * 100) : 0;

                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="font-bold">{cat.category}</span>
                        <span className="text-slate-500">
                          {resolved} Resolved / {open} Open ({pctResolved}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
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

            {/* Ward Grievance Distribution */}
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
                    <div
                      key={ward.ward_name}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{ward.ward_name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Total Complaints Logged: {total}
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {resolved} Closed
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE AGENT ACTION & RESOLUTION MODAL */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Top Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  #{activeModalPost.id}
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    Issue Resolution & Official Action
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    {activeModalPost.category} • {activeModalPost.ward_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalPost(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {updateSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              {/* Photo & Key Details Split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <img
                    src={activeModalPost.photo_url}
                    alt=""
                    className="w-full h-44 rounded-2xl object-cover border border-slate-200 shadow-xs"
                  />
                  <div className="mt-2 text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coordinates: {activeModalPost.lat}, {activeModalPost.lng}</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Citizen Complaint (Raw)
                    </span>
                    <p className="font-semibold text-slate-800 mt-1 leading-relaxed">
                      "{activeModalPost.description}"
                    </p>
                  </div>

                  {activeModalPost.cleaned_description && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                      <span className="text-[10px] font-bold uppercase tracking-wider block">
                        AI English Translation / Summary
                      </span>
                      <p className="font-semibold mt-0.5">
                        {activeModalPost.cleaned_description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                    <span className="text-slate-500 font-medium">Reporting Citizen:</span>
                    <span className="font-bold">{activeModalPost.citizen_name} ({activeModalPost.citizen_phone})</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                    <span className="text-slate-500 font-medium">Community Priority:</span>
                    <span className="font-extrabold text-indigo-700">👍 {activeModalPost.upvotes_count} Upvotes</span>
                  </div>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleSaveStatus} className="space-y-4 pt-2 border-t border-slate-100">
                {/* 1. Status Buttons */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Update Official Workflow Status
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Received', label: '1. Received (Pending)', color: 'bg-sky-600' },
                      { id: 'In Progress', label: '2. In Progress', color: 'bg-amber-500' },
                      { id: 'Resolved', label: '3. Resolved (Closed)', color: 'bg-emerald-600' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setNewStatus(item.id)}
                        className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                          newStatus === item.id
                            ? `${item.color} text-white border-transparent shadow-md scale-102`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Department Assignment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Assigned Municipal Department
                  </label>
                  <select
                    value={newDepartmentId}
                    onChange={(e) => setNewDepartmentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Official Municipal Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. Official Resolution Note (Visible in Citizen Feed)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={officialNote}
                    onChange={(e) => setOfficialNote(e.target.value)}
                    placeholder="e.g. Zone 8 road maintenance crew dispatched with cold-mix asphalt. Work scheduled for completion within 24 hours..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    💡 This message will immediately be visible on the post card in the citizen's neighborhood feed.
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
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
                  >
                    {isUpdating ? 'Publishing...' : 'Save & Publish Resolution'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Kanban individual card component
function KanbanCard({ post, onOpenModal }) {
  return (
    <div
      onClick={onOpenModal}
      className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer space-y-2 group"
    >
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
            CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Other
          }`}
        >
          {post.category}
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            SEVERITY_COLORS[post.severity] || SEVERITY_COLORS.Medium
          }`}
        >
          {post.severity}
        </span>
      </div>

      <div className="flex gap-2.5 items-start">
        <img
          src={post.photo_url}
          alt=""
          className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {post.cleaned_description || post.description}
          </p>
          <div className="text-[10px] text-slate-500 truncate mt-1">
            📍 {post.ward_name}
          </div>
        </div>
      </div>

      {post.official_notes && (
        <div className="p-1.5 bg-sky-50 rounded-lg text-[10px] text-sky-900 border border-sky-200 line-clamp-1">
          <strong>Note:</strong> {post.official_notes}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
        <span className="font-extrabold text-slate-700">👍 {post.upvotes_count} upvotes</span>
        <span className="text-[10px] text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5">
          Action <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
