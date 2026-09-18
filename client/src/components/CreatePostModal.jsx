import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  X,
  Camera,
  MapPin,
  Sparkles,
  AlertTriangle,
  Check,
  ThumbsUp,
  Loader2,
  Navigation,
  Info,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import L from 'leaflet';

// Sample presets for photo so testing is effortless without searching on disk
const SAMPLE_PHOTOS = [
  {
    title: 'Damaged Road / Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
  },
  {
    title: 'Overflowing Garbage Bin',
    url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop&q=60',
  },
  {
    title: 'Water Pipe Leak',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800&auto=format&fit=crop&q=60',
  },
  {
    title: 'Broken Street Light',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60',
  },
];

const SAMPLE_DESCRIPTIONS = [
  'Inga 4th Avenue corner la periya pothole irukku, bikes skid aaguthu',
  'Commercial garbage not cleared for 4 days near bus stop, heavy stink',
  'Drinking water main pipe cracked and continuous clean water overflow',
  'Street light pole flickering and out of order on 2nd cross street',
  'Monsoon storm water drain choked with plastic causing rainwater flooding',
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user, currentWard, setShowAuthModal } = useAuth();

  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Default coordinate based on active ward
  const defaultCoords = currentWard?.municipality_id === 2
    ? { lat: 11.0088, lng: 76.9525 } // Coimbatore RS Puram
    : { lat: 13.0852, lng: 80.2105 }; // Chennai Anna Nagar

  const [coords, setCoords] = useState(defaultCoords);
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  const [description, setDescription] = useState('');
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiClassification, setAiClassification] = useState(null);

  // Duplicate detection states
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateCandidates, setDuplicateCandidates] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Leaflet Mini Map ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setPhotoUrl(SAMPLE_PHOTOS[0].url);
      setPhotoPreview(SAMPLE_PHOTOS[0].url);
      setPhotoFile(null);
      setCoords(defaultCoords);
      setDescription('');
      setAiClassification(null);
      setDuplicateCandidates([]);
      setShowDuplicateWarning(false);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 16,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      // Custom marker icon
      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="background-color:#059669;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 6px -1px rgba(0,0,0,0.3);border:2px solid white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map);

      marker.on('dragend', function (e) {
        const position = marker.getLatLng();
        setCoords({
          lat: parseFloat(position.lat.toFixed(6)),
          lng: parseFloat(position.lng.toFixed(6)),
        });
      });

      // Click on map to move marker
      map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        setCoords({
          lat: parseFloat(e.latlng.lat.toFixed(6)),
          lng: parseFloat(e.latlng.lng.toFixed(6)),
        });
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    } else {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([coords.lat, coords.lng]);
      }
    }

    return () => {
      if (!isOpen && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, coords.lat, coords.lng]);

  // GPS Auto-locate
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: parseFloat(pos.coords.latitude.toFixed(6)),
          lng: parseFloat(pos.coords.longitude.toFixed(6)),
        };
        setCoords(newCoords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setIsGettingGps(false);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newCoords.lat, newCoords.lng], 17);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng]);
        }
      },
      (err) => {
        setIsGettingGps(false);
        // If permission denied in simulator, keep default ward coordinates
        console.warn('GPS location fallback:', err.message);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Debounced Live AI Classification
  useEffect(() => {
    if (!description || description.trim().length < 5) {
      setAiClassification(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsClassifying(true);
      try {
        const res = await api.previewClassify(description);
        if (res.classification) {
          setAiClassification(res.classification);
          // Check duplicates as well
          checkDuplicateNearby(res.classification.category);
        }
      } catch (err) {
        console.warn('Live classification preview error:', err);
      } finally {
        setIsClassifying(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [description]);

  // Check duplicate within ~50m
  const checkDuplicateNearby = async (category) => {
    try {
      setIsCheckingDuplicate(true);
      const res = await api.checkDuplicate({
        lat: coords.lat,
        lng: coords.lng,
        category: category || aiClassification?.category || 'Road',
        description,
        ward_id: currentWard?.ward_id || 1,
      });

      if (res.hasDuplicate && res.candidates?.length > 0) {
        setDuplicateCandidates(res.candidates);
        setShowDuplicateWarning(true);
      } else {
        setDuplicateCandidates([]);
        setShowDuplicateWarning(false);
      }
    } catch (err) {
      console.warn('Duplicate check error:', err);
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
      setPhotoUrl('');
    }
  };

  const handleSelectPresetPhoto = (item) => {
    setPhotoUrl(item.url);
    setPhotoPreview(item.url);
    setPhotoFile(null);
  };

  // 1-Click action to upvote existing duplicate issue
  const handleUpvoteExisting = async (existingPostId) => {
    try {
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      await api.toggleUpvote(existingPostId);
      setSuccessMsg('You upvoted the existing nearby issue! This boosts its priority with the municipality.');
      setTimeout(() => {
        onPostCreated?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to upvote');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!photoPreview && !photoUrl) {
      setError('Please provide a photo of the civic issue');
      return;
    }

    if (!description || description.trim().length < 5) {
      setError('Please provide a clear description of the problem');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append('photo', photoFile);
      } else {
        formData.append('photo_url', photoUrl);
      }

      formData.append('ward_id', currentWard?.ward_id || 1);
      formData.append('lat', coords.lat);
      formData.append('lng', coords.lng);
      formData.append('description', description);

      if (aiClassification) {
        formData.append('category', aiClassification.category);
        formData.append('severity', aiClassification.severity);
        formData.append('cleaned_description', aiClassification.cleaned_description);
      }

      await api.createPost(formData);
      setSuccessMsg('Civic issue reported successfully! Routed automatically to municipality.');
      setTimeout(() => {
        onPostCreated?.();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-4 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-white/20 rounded-md">
              <Camera className="w-4 h-4 text-amber-300" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100">
              Citizen Reporting
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight mt-0.5">Report a Civic Problem</h3>
          <p className="text-xs text-emerald-100/90">
            Scoped to: <strong className="text-white">{currentWard?.ward_name}</strong>
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* DUPLICATE DETECTION BANNER (~50m radius) */}
          {showDuplicateWarning && duplicateCandidates.length > 0 && (
            <div className="p-4 bg-amber-50/90 border-2 border-amber-400/80 rounded-2xl shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-amber-950">
                      Nearby Similar Issue Found ({duplicateCandidates[0].distance_meters}m away)
                    </h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      ~50m Match
                    </span>
                  </div>
                  <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                    Someone in your neighborhood already reported a similar{' '}
                    <strong>{duplicateCandidates[0].category}</strong> problem{' '}
                    <strong>{duplicateCandidates[0].distance_meters} meters</strong> from this location:
                  </p>
                  <div className="mt-2 p-2.5 bg-white/90 rounded-xl border border-amber-200 text-xs text-slate-800 flex items-center gap-3">
                    {duplicateCandidates[0].photo_url && (
                      <img
                        src={duplicateCandidates[0].photo_url}
                        alt="Existing issue"
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {duplicateCandidates[0].cleaned_description || duplicateCandidates[0].description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-medium text-emerald-700">
                          👍 {duplicateCandidates[0].upvotes_count} citizen upvotes
                        </span>
                        <span>• Status: {duplicateCandidates[0].status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for duplicate */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpvoteExisting(duplicateCandidates[0].id)}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Upvote That Issue Instead (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDuplicateWarning(false)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
                    >
                      Report As Separate Issue Anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Photo Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Photo Evidence <span className="text-rose-500">*</span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 items-start">
              {/* Image Preview Box */}
              <div className="relative w-full sm:w-44 h-36 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 group">
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Change Photo
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <span className="text-[11px] font-medium">No photo selected</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              {/* Upload file or click preset photo */}
              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold border border-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload from Device
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">or pick demo image:</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_PHOTOS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPresetPhoto(item)}
                      className={`text-left p-1.5 rounded-lg border text-[11px] truncate transition-all flex items-center gap-2 ${
                        photoUrl === item.url
                          ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-900'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt=""
                        className="w-6 h-6 rounded object-cover shrink-0"
                      />
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Location Map & Pin Drop */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Exact Location (GPS / Pin-Drop Fallback) <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleGetGps}
                disabled={isGettingGps}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
              >
                <Navigation className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                <span>{isGettingGps ? 'Locating...' : 'Auto-Capture GPS'}</span>
              </button>
            </div>

            {/* Interactive Leaflet Map for Pin Drop */}
            <div className="relative w-full h-44 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div ref={mapContainerRef} className="w-full h-full" />
              <div className="absolute bottom-2 left-2 z-20 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-slate-700 border border-slate-200 shadow-2xs">
                📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                {gpsAccuracy && ` (±${gpsAccuracy}m)`}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Drag the green pin or tap anywhere on the map to pinpoint the exact pothole, pipe leak, or garbage spot.
            </p>
          </div>

          {/* Step 3: Description & AI Auto-Tagging */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Issue Description (Tamil / English / Tanglish) <span className="text-rose-500">*</span>
            </label>

            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Inga 4th Avenue junction la periya pothole irukku, rain water thengi nikithu... (Type in English, Tamil, or Tanglish)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />

            {/* Quick Prompt Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[11px] text-slate-400 self-center mr-1">Quick examples:</span>
              {SAMPLE_DESCRIPTIONS.map((desc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDescription(desc)}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-[10px] text-slate-600 font-medium truncate max-w-[220px]"
                >
                  "{desc}"
                </button>
              ))}
            </div>

            {/* AI AUTO-FILL PREVIEW CARD */}
            <div className="mt-3.5 p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-cyan-50/80 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI Auto-Classification (NLU Engine)</span>
                </div>
                {isClassifying && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                  </span>
                )}
              </div>

              {aiClassification ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                    <span className="font-extrabold text-emerald-800">{aiClassification.category}</span>
                  </div>
                  <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Routed Department</span>
                    <span className="font-bold text-slate-800 truncate block" title={aiClassification.department}>
                      {aiClassification.department}
                    </span>
                  </div>
                  <div className="p-2 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assessed Severity</span>
                    <span
                      className={`font-extrabold inline-block px-2 py-0.5 rounded text-[11px] ${
                        aiClassification.severity === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : aiClassification.severity === 'Low'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {aiClassification.severity} Priority
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Type your issue description above — AI will auto-extract category, routed municipality department, and severity level.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Submit Civic Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
