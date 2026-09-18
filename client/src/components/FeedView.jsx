import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PostCard from './PostCard';
import {
  Flame,
  Clock,
  MapPin,
  PlusCircle,
  AlertTriangle,
  RefreshCw,
  Building,
  Camera,
  Sparkles,
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
      {/* Neumorphic Ward Banner */}
      <div className="neu-card rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebf0f7] shadow-[inset_2px_2px_4px_#cbd6e4,inset_-2px_-2px_4px_#ffffff] text-emerald-800 text-xs font-extrabold mb-3">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-Time Citizen Ward Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
              {currentWard?.ward_name || 'Anna Nagar West'}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 flex items-center gap-2 font-medium">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentWard?.municipality_name || 'Greater Chennai Corporation'}</span>
              <span>• {currentWard?.district || 'Chennai'} District</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLocationModal(true)}
              className="px-4 py-2.5 rounded-2xl neu-btn text-xs font-bold text-slate-700"
            >
              Change Ward
            </button>
            <button
              onClick={onOpenCreatePost}
              className="px-5 py-2.5 rounded-2xl neu-btn-primary text-xs font-bold flex items-center gap-1.5 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Neumorphic Control Toolbar */}
      <div className="neu-flat rounded-3xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sort Buttons */}
          <div className="flex items-center gap-2 p-1.5 bg-[#ebf0f7] rounded-2xl shadow-[inset_3px_3px_6px_#cbd6e4,inset_-3px_-3px_6px_#ffffff]">
            <button
              type="button"
              onClick={() => setSort('newest')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sort === 'newest' ? 'neu-pill-active' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Newest First
            </button>

            <button
              type="button"
              onClick={() => setSort('upvotes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sort === 'upvotes' ? 'neu-pill-active text-amber-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Most Upvoted
            </button>

            <button
              type="button"
              onClick={() => setSort('severity')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                sort === 'severity' ? 'neu-pill-active text-rose-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              High Severity
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-2 rounded-xl neu-btn text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Received">Received (Pending)</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <button
              type="button"
              onClick={fetchPosts}
              className={`p-2.5 rounded-xl neu-btn text-slate-600 ${
                refreshing ? 'animate-spin' : ''
              }`}
              title="Refresh feed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Filter:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'neu-btn-primary'
                    : 'neu-btn text-slate-700 hover:text-emerald-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stream of Real Issues */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">
            Loading real civic reports in {currentWard?.ward_name}...
          </p>
        </div>
      ) : posts.length === 0 ? (
        /* CLEAN SLATE (NO DUMMY POSTS) */
        <div className="neu-card rounded-3xl p-10 sm:p-14 text-center space-y-4">
          <div className="w-18 h-18 rounded-3xl bg-[#ebf0f7] shadow-[6px_6px_14px_#cbd6e4,-6px_-6px_14px_#ffffff] text-emerald-600 flex items-center justify-center mx-auto border border-white/60">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800">
              No Issues Reported in this Ward Yet
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
              Dummy sample complaints have been cleared. As citizens in <strong>{currentWard?.ward_name}</strong> upload real road, garbage, water, or lighting problems, they will appear here instantly!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenCreatePost}
              className="px-6 py-3 rounded-2xl neu-btn-primary text-xs font-bold inline-flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report First Real Issue Now</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpvoteChange={handleUpvoteChange} />
          ))}
        </div>
      )}
    </div>
  );
}
