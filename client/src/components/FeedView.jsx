import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PostCard from './PostCard';
import {
  Flame,
  Clock,
  Filter,
  MapPin,
  PlusCircle,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Layers,
  Building,
} from 'lucide-react';

const CATEGORIES = ['All', 'Road', 'Water', 'Electricity', 'Garbage', 'Drainage'];

export default function FeedView({ onOpenCreatePost }) {
  const { currentWard, setShowLocationModal } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest'); // 'newest' | 'upvotes' | 'severity'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      setRefreshing(true);
      const params = {
        ward_id: currentWard?.ward_id || 1,
        sort,
      };
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedStatus !== 'All') params.status = selectedStatus;

      const res = await api.getPosts(params);
      if (res.posts) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.error('Failed to load feed posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentWard?.ward_id, sort, selectedCategory, selectedStatus]);

  const handleUpvoteChange = (postId, hasUpvoted, newCount) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, has_upvoted: hasUpvoted, upvotes_count: newCount } : p
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Ward Information & Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5" />
              <span>Hyper-Local Jurisdiction Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentWard?.ward_name || 'Anna Nagar West'}
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 flex items-center gap-2">
              <Building className="w-3.5 h-3.5" />
              <span>{currentWard?.municipality_name || 'Greater Chennai Corporation'}</span>
              <span>• {currentWard?.district || 'Chennai'} District</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all backdrop-blur-md"
            >
              Switch Ward
            </button>
            <button
              onClick={onOpenCreatePost}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Problem</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Sorting & Category Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        {/* Top bar: Sort options and refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setSort('newest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                sort === 'newest'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Newest First
            </button>

            <button
              type="button"
              onClick={() => setSort('upvotes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                sort === 'upvotes'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Most Upvoted
            </button>

            <button
              type="button"
              onClick={() => setSort('severity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                sort === 'severity'
                  ? 'bg-white text-rose-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              High Severity
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Status filter dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received (Open)</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <button
              type="button"
              onClick={fetchPosts}
              className={`p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors ${
                refreshing ? 'animate-spin' : ''
              }`}
              title="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Category:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Post Stream */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading civic issues from {currentWard?.ward_name}...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No issues found in this area</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Be the first community champion to report a road, garbage, water, or lighting issue in this ward!
            </p>
          </div>
          <button
            onClick={onOpenCreatePost}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report First Issue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpvoteChange={handleUpvoteChange} />
          ))}
        </div>
      )}
    </div>
  );
}
