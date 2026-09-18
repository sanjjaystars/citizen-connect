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
  Search,
  MapPin,
  Phone,
  User,
  Edit3,
  BarChart3,
  Layers,
  RefreshCw,
  X,
  Check,
  Columns,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

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
  const { user, quickLogin } = useAuth();
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

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table' | 'analytics'

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

      setUpdateSuccess(`Status updated to "${newStatus}"! Real-time note published to citizen feed.`);

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

      api.getAnalytics(municipalityId).then(setAnalytics).catch(console.warn);

      setTimeout(() => {
        setActiveModalPost(null);
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Dedicated Official Login Screen
  if (!isOfficial) {
    return (
      <div className="min-h-[85vh] bg-[#ebf0f7] flex items-center justify-center p-4">
        <div className="w-full max-w-lg neu-card rounded-3xl p-6 sm:p-8 border border-white/80 shadow-[10px_10px_25px_#cad4e3,-10px_-10px_25px_#ffffff]">
          <div className="w-14 h-14 rounded-2xl bg-[#ebf0f7] shadow-[5px_5px_12px_#cad5e3,-5px_-5px_12px_#ffffff] text-indigo-700 flex items-center justify-center mb-5 mx-auto border border-white/60">
            <Shield className="w-7 h-7" />
          </div>

          <div className="text-center space-y-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
              Restricted Authority
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
              Municipality Agent Console
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Reserved for municipal corporation zonal officers and field engineers to view and resolve real citizen complaints.
            </p>
          </div>

          {/* Quick 1-Click Agent Profiles */}
          <div className="space-y-3 p-4 bg-[#ebf0f7] shadow-[inset_3px_3px_6px_#cbd6e4,inset_-3px_-3px_6px_#ffffff] rounded-2xl mb-6">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              1-Click Municipality Agent Login
            </div>

            <button
              onClick={() => quickLogin('official-chennai')}
              className="w-full text-left p-3.5 rounded-2xl neu-btn text-xs flex items-center justify-between group"
            >
              <div>
                <div className="font-extrabold text-slate-900 text-sm">
                  Greater Chennai Corporation (GCC)
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Officer Rajesh Kumar • Zone 8 Command
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => quickLogin('official-coimbatore')}
              className="w-full text-left p-3.5 rounded-2xl neu-btn text-xs flex items-center justify-between group"
            >
              <div>
                <div className="font-extrabold text-slate-900 text-sm">
                  Coimbatore City Municipal Corporation (CCMC)
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Officer Meena Sundaram • Central Zone Command
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              onClick={onSwitchToCitizen}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold underline"
            >
              ← Return to Citizen Community Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  const kanbanColumns = {
    Received: posts.filter((p) => p.status === 'Received'),
    'In Progress': posts.filter((p) => p.status === 'In Progress'),
    Resolved: posts.filter((p) => p.status === 'Resolved'),
  };

  return (
    <div className="min-h-screen bg-[#ebf0f7] text-slate-900 pb-16">
      {/* Top Municipal Executive Header Bar */}
      <div className="bg-[#ebf0f7] border-b border-[#cbd6e4] sticky top-18 z-30 shadow-[0_4px_12px_#cbd6e4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ebf0f7] shadow-[4px_4px_8px_#cbd6e4,-4px_-4px_8px_#ffffff] text-indigo-700 flex items-center justify-center border border-white/60">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900">
                  {municipalityName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Agent Console
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Officer: <strong className="text-slate-800">{user?.name}</strong> ({user?.phone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#ebf0f7] p-1 rounded-xl shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff]">
              <button
                onClick={() => quickLogin('official-chennai')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  municipalityId === 1 ? 'neu-pill-active text-indigo-700' : 'text-slate-600'
                }`}
              >
                Chennai GCC
              </button>
              <button
                onClick={() => quickLogin('official-coimbatore')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  municipalityId === 2 ? 'neu-pill-active text-indigo-700' : 'text-slate-600'
                }`}
              >
                Coimbatore CCMC
              </button>
            </div>

            <button
              onClick={onSwitchToCitizen}
              className="px-3.5 py-1.5 rounded-xl neu-btn text-xs font-bold text-slate-700 flex items-center gap-1.5"
            >
              <span>Citizen View</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric KPI Tiles */}
        {analytics?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="neu-card rounded-2xl p-4">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Issues Logged</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">
                {analytics.summary.total_issues || 0}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Across all wards</span>
            </div>

            <div className="neu-card rounded-2xl p-4">
              <span className="text-[11px] uppercase font-bold text-sky-600 block">1. Received (Pending)</span>
              <div className="text-2xl sm:text-3xl font-black text-sky-700 mt-1">
                {analytics.summary.count_received || 0}
              </div>
              <span className="text-[10px] text-sky-600/80 mt-0.5 block">Awaiting inspection</span>
            </div>

            <div className="neu-card rounded-2xl p-4">
              <span className="text-[11px] uppercase font-bold text-amber-600 block">2. In Progress</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">
                {analytics.summary.count_in_progress || 0}
              </div>
              <span className="text-[10px] text-amber-600/80 mt-0.5 block">Crew dispatched</span>
            </div>

            <div className="neu-card rounded-2xl p-4">
              <span className="text-[11px] uppercase font-bold text-emerald-600 block">3. Resolved</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                {analytics.summary.count_resolved || 0}
              </div>
              <span className="text-[10px] text-emerald-600/80 mt-0.5 block">Closed & confirmed</span>
            </div>

            <div className="neu-card rounded-2xl p-4 border border-rose-200">
              <span className="text-[11px] uppercase font-bold text-rose-700 block flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> High Severity
              </span>
              <div className="text-2xl sm:text-3xl font-black text-rose-800 mt-1">
                {analytics.summary.count_high_priority || 0}
              </div>
              <span className="text-[10px] text-rose-600 mt-0.5 block">Urgent priority</span>
            </div>
          </div>
        )}

        {/* Neumorphic Toolbar */}
        <div className="neu-flat rounded-3xl p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 p-1.5 bg-[#ebf0f7] rounded-2xl shadow-[inset_3px_3px_6px_#cbd6e4,inset_-3px_-3px_6px_#ffffff]">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'kanban' ? 'neu-pill-active text-indigo-700' : 'text-slate-600'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Kanban Pipeline
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'neu-pill-active text-indigo-700' : 'text-slate-600'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Table View
              </button>

              <button
                onClick={() => setViewMode('analytics')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'analytics' ? 'neu-pill-active text-indigo-700' : 'text-slate-600'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Resolution Analytics
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAdminData()}
                  placeholder="Search real complaints by text, citizen name, phone..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl neu-input text-xs font-medium"
                />
              </div>

              <button
                onClick={fetchAdminData}
                className="p-2.5 rounded-2xl neu-btn text-slate-600"
                title="Refresh issues"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] uppercase font-bold">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-slate-700"
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
                className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-slate-700"
              >
                <option value="All">All Severities</option>
                <option value="High">🚨 High Only</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {departments.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] uppercase font-bold">Department:</span>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-slate-700 max-w-[180px] truncate"
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
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Loading municipal complaints data...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="neu-card rounded-3xl p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#ebf0f7] shadow-[4px_4px_8px_#cbd6e4,-4px_-4px_8px_#ffffff] text-indigo-700 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">
              No Citizen Complaints in Queue
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Dummy sample issues have been cleared. As real citizens upload problems via the app, they will appear here in real time for inspection and dispatch!
            </p>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Received */}
            <div className="neu-flat rounded-3xl p-4 space-y-3 border border-sky-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">1. Received (Pending)</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                  {kanbanColumns['Received'].length}
                </span>
              </div>

              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {kanbanColumns['Received'].map((post) => (
                  <KanbanCard key={post.id} post={post} onOpenModal={() => handleOpenStatusModal(post)} />
                ))}
              </div>
            </div>

            {/* 2. In Progress */}
            <div className="neu-flat rounded-3xl p-4 space-y-3 border border-amber-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">2. In Progress</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  {kanbanColumns['In Progress'].length}
                </span>
              </div>

              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {kanbanColumns['In Progress'].map((post) => (
                  <KanbanCard key={post.id} post={post} onOpenModal={() => handleOpenStatusModal(post)} />
                ))}
              </div>
            </div>

            {/* 3. Resolved */}
            <div className="neu-flat rounded-3xl p-4 space-y-3 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-800">3. Resolved</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  {kanbanColumns['Resolved'].length}
                </span>
              </div>

              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                {kanbanColumns['Resolved'].map((post) => (
                  <KanbanCard key={post.id} post={post} onOpenModal={() => handleOpenStatusModal(post)} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="neu-card rounded-3xl overflow-hidden border border-white/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#ebf0f7] border-b border-[#cbd6e4] text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Ticket</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description & Location</th>
                    <th className="py-3.5 px-4">Citizen Contact</th>
                    <th className="py-3.5 px-4">Upvotes</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 bg-[#ebf0f7]">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.photo_url}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
                          />
                          <span className="font-mono font-bold text-slate-500">#{p.id}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.category}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {p.department_name}
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
                          className="text-[11px] text-indigo-700 hover:underline flex items-center gap-1 font-mono font-bold"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{p.citizen_phone}</span>
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-800 neu-btn px-2.5 py-1 rounded-lg">
                          👍 {p.upvotes_count}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
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
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenStatusModal(p)}
                          className="px-3.5 py-1.5 neu-btn-indigo rounded-xl text-xs font-bold"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {activeModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl neu-card rounded-3xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-white/80">
            <div className="bg-[#ebf0f7] border-b border-[#cbd6e4] p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  #{activeModalPost.id}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">
                    Municipal Resolution & Action
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeModalPost.category} • {activeModalPost.ward_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalPost(null)}
                className="p-2 rounded-xl neu-btn text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 bg-[#ebf0f7]">
              {updateSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <img
                    src={activeModalPost.photo_url}
                    alt=""
                    className="w-full h-44 rounded-2xl object-cover shadow-sm border border-slate-200"
                  />
                  <div className="mt-2 text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Location: {activeModalPost.lat}, {activeModalPost.lng}</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl neu-flat">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Citizen Description
                    </span>
                    <p className="font-bold text-slate-800 mt-1 leading-relaxed">
                      "{activeModalPost.description}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl neu-flat">
                    <span className="text-slate-500 font-medium">Reporting Citizen:</span>
                    <span className="font-bold">{activeModalPost.citizen_name} ({activeModalPost.citizen_phone})</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl neu-flat">
                    <span className="text-slate-500 font-medium">Priority Upvotes:</span>
                    <span className="font-extrabold text-indigo-700">👍 {activeModalPost.upvotes_count} Upvotes</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveStatus} className="space-y-4 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    1. Update Official Status
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
                        className={`py-2.5 px-2 text-xs font-bold rounded-2xl border transition-all ${
                          newStatus === item.id
                            ? `${item.color} text-white shadow-md scale-102`
                            : 'neu-btn text-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Official Action Note (Synced Real-Time to Citizens)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={officialNote}
                    onChange={(e) => setOfficialNote(e.target.value)}
                    placeholder="e.g. Field repair crew dispatched with cold-mix asphalt. Expected resolution in 24 hours..."
                    className="w-full px-4 py-2.5 rounded-2xl neu-input text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setActiveModalPost(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2.5 rounded-2xl neu-btn-indigo text-xs font-bold flex items-center gap-2"
                  >
                    {isUpdating ? 'Saving...' : 'Save & Sync Real-Time'}
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

function KanbanCard({ post, onOpenModal }) {
  return (
    <div
      onClick={onOpenModal}
      className="neu-card rounded-2xl p-3.5 cursor-pointer space-y-2 group hover:scale-[1.01] transition-all"
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
          className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
            {post.cleaned_description || post.description}
          </p>
          <div className="text-[10px] text-slate-500 truncate mt-1">
            📍 {post.ward_name}
          </div>
        </div>
      </div>

      {post.official_notes && (
        <div className="p-1.5 bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] rounded-lg text-[10px] text-indigo-900 line-clamp-1">
          <strong>Note:</strong> {post.official_notes}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
        <span className="font-extrabold text-slate-700">👍 {post.upvotes_count} upvotes</span>
        <span className="text-[10px] text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5">
          Action <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
