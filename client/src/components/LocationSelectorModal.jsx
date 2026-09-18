import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MapPin, CheckCircle2, ChevronRight, X, Building2 } from 'lucide-react';

export default function LocationSelectorModal() {
  const { showLocationModal, setShowLocationModal, setLocation, currentWard } = useAuth();
  const [hierarchy, setHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedState, setSelectedState] = useState('Tamil Nadu');
  const [selectedDistrict, setSelectedDistrict] = useState('Chennai');
  const [selectedMuniId, setSelectedMuniId] = useState(1);
  const [selectedWardId, setSelectedWardId] = useState(1);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await api.getHierarchy();
        if (res.hierarchy) {
          setHierarchy(res.hierarchy);
          // Set initial defaults from currentWard if available
          if (currentWard) {
            setSelectedMuniId(currentWard.municipality_id || 1);
            setSelectedWardId(currentWard.ward_id || 1);
          }
        }
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, [showLocationModal]);

  if (!showLocationModal) return null;

  const states = hierarchy ? Object.keys(hierarchy) : ['Tamil Nadu'];
  const districts = (hierarchy && selectedState && hierarchy[selectedState]) ? Object.keys(hierarchy[selectedState]) : ['Chennai', 'Coimbatore'];
  const municipalities = (hierarchy && selectedState && selectedDistrict && hierarchy[selectedState][selectedDistrict])
    ? hierarchy[selectedState][selectedDistrict]
    : [];
  const activeMuni = municipalities.find((m) => m.id === selectedMuniId) || municipalities[0];
  const wards = activeMuni ? activeMuni.wards : [];

  const handleStateChange = (st) => {
    setSelectedState(st);
    const firstDist = hierarchy[st] ? Object.keys(hierarchy[st])[0] : '';
    setSelectedDistrict(firstDist);
    const munis = hierarchy[st]?.[firstDist] || [];
    if (munis[0]) {
      setSelectedMuniId(munis[0].id);
      setSelectedWardId(munis[0].wards[0]?.id || 1);
    }
  };

  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    const munis = hierarchy[selectedState]?.[dist] || [];
    if (munis[0]) {
      setSelectedMuniId(munis[0].id);
      setSelectedWardId(munis[0].wards[0]?.id || 1);
    }
  };

  const handleMuniChange = (mId) => {
    const id = parseInt(mId, 10);
    setSelectedMuniId(id);
    const muni = municipalities.find((m) => m.id === id);
    if (muni && muni.wards[0]) {
      setSelectedWardId(muni.wards[0].id);
    }
  };

  const handleConfirm = () => {
    const muni = municipalities.find((m) => m.id === selectedMuniId) || municipalities[0];
    const ward = wards.find((w) => w.id === selectedWardId) || wards[0];

    if (muni && ward) {
      setLocation({
        state: selectedState,
        district: selectedDistrict,
        municipality_id: muni.id,
        municipality_name: muni.name,
        ward_id: ward.id,
        ward_name: ward.name,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white relative">
          <button
            onClick={() => setShowLocationModal(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
              <MapPin className="w-5 h-5 text-amber-300" />
            </span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100">Jurisdiction Mapping</span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Select Your Ward / Area</h3>
          <p className="text-sm text-emerald-100/90 mt-1">
            Your civic feed and complaint routing are automatically scoped to your designated municipal ward
          </p>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading municipal administrative boundaries...</div>
          ) : (
            <>
              {/* Step 1: State */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  1. State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: District */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  2. District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Municipality / Corporation */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  3. Municipal Corporation / Local Body
                </label>
                <select
                  value={selectedMuniId}
                  onChange={(e) => handleMuniChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                >
                  {municipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: Ward / Area */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  4. Ward / Residential Area
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {wards.map((w) => {
                    const isSelected = selectedWardId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWardId(w.id)}
                        className={`text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <span className="truncate">{w.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Confirm Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span>Confirm Area & View Feed</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
