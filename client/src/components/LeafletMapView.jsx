import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import L from 'leaflet';
import { MapPin, Navigation, Layers, RefreshCw, ThumbsUp } from 'lucide-react';

const CATEGORY_COLORS = {
  Road: '#f59e0b', // amber
  Garbage: '#10b981', // emerald
  Water: '#3b82f6', // blue
  Electricity: '#8b5cf6', // purple
  Drainage: '#06b6d4', // cyan
  Other: '#64748b', // slate
};

export default function LeafletMapView({ onOpenCreatePost }) {
  const { currentWard } = useAuth();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Center coordinates based on current ward
  const center = currentWard?.municipality_id === 2
    ? [11.0088, 76.9525] // Coimbatore
    : [13.0852, 80.2105]; // Chennai Anna Nagar

  const fetchMapPosts = async () => {
    setLoading(true);
    try {
      const res = await api.getPosts({
        ward_id: currentWard?.ward_id || 1,
        limit: 100,
      });
      if (res.posts) {
        setPosts(res.posts);
      }
    } catch (err) {
      console.error('Failed to fetch map posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapPosts();
  }, [currentWard?.ward_id]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: 15,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, 15);
    }

    return () => {
      // Keep instance unless unmounted
    };
  }, [currentWard?.ward_id]);

  // Update markers when posts change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    posts.forEach((post) => {
      if (!post.lat || !post.lng) return;

      const catColor = CATEGORY_COLORS[post.category] || '#059669';
      const statusBorder = post.status === 'Resolved' ? '#10b981' : post.status === 'In Progress' ? '#f59e0b' : '#0284c7';

      const customIcon = L.divIcon({
        className: 'civic-marker',
        html: `
          <div style="
            background-color: ${catColor};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            border: 3px solid ${statusBorder};
            font-size: 13px;
            font-weight: bold;
          ">
            ${post.category === 'Road' ? '🛣️' : post.category === 'Garbage' ? '🗑️' : post.category === 'Water' ? '💧' : post.category === 'Electricity' ? '⚡' : '🌊'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([post.lat, post.lng], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; max-width: 260px; padding: 4px;">
          <img src="${post.photo_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 12px; color: #0f172a;">${post.category} Issue</strong>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 9999px; background-color: #f1f5f9; font-weight: bold;">${post.severity}</span>
          </div>
          <p style="font-size: 11px; color: #334155; margin: 0 0 6px 0; line-height: 1.4;">${post.description.slice(0, 80)}...</p>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px; font-size: 11px;">
            <span style="font-weight: bold; color: #059669;">👍 ${post.upvotes_count || 0} upvotes</span>
            <span style="font-size: 10px; font-weight: bold; color: #0284c7;">${post.status}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current.addLayer(marker);
    });
  }, [posts]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Ward Issue Geo-Spatial Map</h2>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
              {posts.length} Active Pins
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time interactive OpenStreetMap showing reported civic problems in {currentWard?.ward_name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (mapInstanceRef.current) mapInstanceRef.current.setView(center, 15);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            Recenter Ward
          </button>
          <button
            onClick={fetchMapPosts}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            title="Refresh map pins"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenCreatePost}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <MapPin className="w-3.5 h-3.5" />
            Drop Pin & Report
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div className="relative w-full h-[65vh] rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md text-xs space-y-1.5">
          <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">
            Category Legend
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Road (🛣️)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Garbage (🗑️)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Water (💧)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Electricity (⚡)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Drainage (🌊)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
