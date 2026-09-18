import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ThumbsUp,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  Share2,
  Flame,
  Check,
} from 'lucide-react';

const CATEGORY_COLORS = {
  Road: 'bg-amber-100 text-amber-900 border-amber-300',
  Garbage: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  Water: 'bg-blue-100 text-blue-900 border-blue-300',
  Electricity: 'bg-purple-100 text-purple-900 border-purple-300',
  Drainage: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  Other: 'bg-slate-100 text-slate-900 border-slate-300',
};

const STATUS_CONFIG = {
  Received: {
    label: 'Received',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    icon: Clock,
    step: 1,
  },
  'In Progress': {
    label: 'In Progress',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: AlertCircle,
    step: 2,
  },
  Resolved: {
    label: 'Resolved',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: CheckCircle2,
    step: 3,
  },
};

export default function PostCard({ post, onUpvoteChange }) {
  const { user, setShowAuthModal } = useAuth();
  const [upvoted, setUpvoted] = useState(post.has_upvoted);
  const [upvotesCount, setUpvotesCount] = useState(post.upvotes_count || 0);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState(false);

  const statusInfo = STATUS_CONFIG[post.status] || STATUS_CONFIG.Received;
  const StatusIcon = statusInfo.icon;

  const handleUpvote = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic UI update
    const previousUpvoted = upvoted;
    const previousCount = upvotesCount;
    setUpvoted(!previousUpvoted);
    setUpvotesCount(previousUpvoted ? previousCount - 1 : previousCount + 1);

    setIsUpvoting(true);
    try {
      const res = await api.toggleUpvote(post.id);
      setUpvoted(res.has_upvoted);
      setUpvotesCount(res.upvotes_count);
      onUpvoteChange?.(post.id, res.has_upvoted, res.upvotes_count);
    } catch (err) {
      // Revert on error
      setUpvoted(previousUpvoted);
      setUpvotesCount(previousCount);
      console.error('Upvote failed:', err);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = new Date(post.created_at).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="bg-white rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all overflow-hidden flex flex-col group">
      {/* Post Header: Citizen details & Badges */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {post.author_name ? post.author_name[0] : 'C'}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                {post.author_name || 'Concerned Citizen'}
              </h4>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[170px]">{post.ward_name}</span>
                <span>• {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Category & Severity Pills */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                CATEGORY_COLORS[post.category] || CATEGORY_COLORS.Other
              }`}
            >
              {post.category}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                post.severity === 'High'
                  ? 'bg-rose-100 text-rose-800'
                  : post.severity === 'Low'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {post.severity}
            </span>
          </div>
        </div>
      </div>

      {/* Photo Container */}
      <div className="relative aspect-16/10 bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setExpandedPhoto(!expandedPhoto)}>
        <img
          src={post.photo_url}
          alt={post.category}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          loading="lazy"
        />

        {/* GPS location pill overlay */}
        <div className="absolute bottom-2 left-2 bg-slate-900/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-mono flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>{post.lat?.toFixed(4)}, {post.lng?.toFixed(4)}</span>
        </div>

        {/* Status ribbon overlay */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow-xs flex items-center gap-1.5 ${statusInfo.badge}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusInfo.label}</span>
          </span>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* AI Cleaned summary highlight */}
          {post.cleaned_description && (
            <div className="mb-2 flex items-start gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50/70 border border-emerald-200/60 p-2 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{post.cleaned_description}</span>
            </div>
          )}

          {/* Original Citizen Description (Tamil/English) */}
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            "{post.description}"
          </p>

          {/* Routed Department */}
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-semibold">Routed To:</span>
            <span className="truncate">{post.department_name || 'General Municipal Administration'}</span>
          </div>
        </div>

        {/* Official Status Progress Tracker */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
            <span className={statusInfo.step >= 1 ? 'text-sky-700' : ''}>1. Received</span>
            <span className={statusInfo.step >= 2 ? 'text-amber-700' : ''}>2. In Progress</span>
            <span className={statusInfo.step >= 3 ? 'text-emerald-700' : ''}>3. Resolved</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                statusInfo.step === 3
                  ? 'bg-emerald-500 w-full'
                  : statusInfo.step === 2
                  ? 'bg-amber-500 w-2/3'
                  : 'bg-sky-500 w-1/3'
              }`}
            />
          </div>

          {/* Official Notes Alert (if municipality provided an update) */}
          {post.official_notes && (
            <div className="mt-2.5 p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
              <div className="flex items-center gap-1.5 font-bold mb-0.5 text-sky-950">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-700" />
                <span>Official Municipal Action Note:</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                "{post.official_notes}"
              </p>
            </div>
          )}
        </div>

        {/* Card Footer: Upvote / Me Too action button & Share */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              upvoted
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 scale-102'
                : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${upvoted ? 'fill-current' : ''}`} />
            <span>{upvoted ? 'Upvoted (Me Too)' : 'Me Too / Upvote'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                upvoted ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {upvotesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors text-xs font-medium flex items-center gap-1"
            title="Share issue link"
          >
            {copied ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Copied
              </span>
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
