import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { SearchableSelect, OptionItem } from './SearchableSelect';
import { DistrictMaster, BlockMaster, GramPanchayatMaster, VillageMaster, LocationSelection } from '../../types/index';

interface OdishaLocationSelectorProps {
  idPrefix?: string;
  value?: LocationSelection;
  onChange: (selection: LocationSelection) => void;
  required?: boolean;
  showMapPinBadge?: boolean;
  showValidationBanner?: boolean;
  hideGpAndVillage?: boolean;
  className?: string;
}

export const OdishaLocationSelector: React.FC<OdishaLocationSelectorProps> = ({
  idPrefix = 'loc',
  value,
  onChange,
  required = false,
  showMapPinBadge = true,
  showValidationBanner = true,
  hideGpAndVillage = false,
  className = ''
}) => {
  // Master data state caches
  const [districts, setDistricts] = useState<DistrictMaster[]>([]);
  const [blocks, setBlocks] = useState<BlockMaster[]>([]);
  const [gps, setGps] = useState<GramPanchayatMaster[]>([]);
  const [villages, setVillages] = useState<VillageMaster[]>([]);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Local selection state
  const [selectedDistrictId, setSelectedDistrictId] = useState(value?.districtId || '');
  const [selectedBlockId, setSelectedBlockId] = useState(value?.blockId || '');
  const [selectedGpId, setSelectedGpId] = useState(value?.gpId || '');
  const [selectedVillageId, setSelectedVillageId] = useState(value?.villageId || '');

  // Keep internal state in sync with external value if props change
  useEffect(() => {
    if (value) {
      if (value.districtId && value.districtId !== selectedDistrictId) setSelectedDistrictId(value.districtId);
      if (value.blockId && value.blockId !== selectedBlockId) setSelectedBlockId(value.blockId);
      if (value.gpId && value.gpId !== selectedGpId) setSelectedGpId(value.gpId);
      if (value.villageId && value.villageId !== selectedVillageId) setSelectedVillageId(value.villageId);
    }
  }, [value]);

  // 1. Fetch Districts on initial mount
  useEffect(() => {
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await fetch('/api/master/districts');
        const data = await res.json();
        if (data.success) {
          setDistricts(data.districts);
        }
      } catch (err) {
        console.error('Failed to load districts master data', err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, []);

  // 2. Fetch Blocks when selectedDistrictId changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setBlocks([]);
      return;
    }

    const fetchBlocks = async () => {
      setLoadingBlocks(true);
      try {
        const res = await fetch(`/api/master/blocks?districtId=${encodeURIComponent(selectedDistrictId)}`);
        const data = await res.json();
        if (data.success) {
          setBlocks(data.blocks);
        }
      } catch (err) {
        console.error('Failed to load blocks for district:', selectedDistrictId, err);
      } finally {
        setLoadingBlocks(false);
      }
    };
    fetchBlocks();
  }, [selectedDistrictId]);

  // 3. Fetch GPs when selectedBlockId changes
  useEffect(() => {
    if (!selectedBlockId) {
      setGps([]);
      return;
    }

    const fetchGps = async () => {
      setLoadingGps(true);
      try {
        const res = await fetch(`/api/master/gps?blockId=${encodeURIComponent(selectedBlockId)}`);
        const data = await res.json();
        if (data.success) {
          setGps(data.gps);
        }
      } catch (err) {
        console.error('Failed to load GPs for block:', selectedBlockId, err);
      } finally {
        setLoadingGps(false);
      }
    };
    fetchGps();
  }, [selectedBlockId]);

  // 4. Fetch Villages when selectedGpId changes
  useEffect(() => {
    if (!selectedGpId) {
      setVillages([]);
      return;
    }

    const fetchVillages = async () => {
      setLoadingVillages(true);
      try {
        const res = await fetch(`/api/master/villages?gpId=${encodeURIComponent(selectedGpId)}`);
        const data = await res.json();
        if (data.success) {
          setVillages(data.villages);
        }
      } catch (err) {
        console.error('Failed to load villages for GP:', selectedGpId, err);
      } finally {
        setLoadingVillages(false);
      }
    };
    fetchVillages();
  }, [selectedGpId]);

  // Handle District Change -> Clear Block, GP, Village
  const handleDistrictChange = (distId: string, distOpt?: OptionItem) => {
    const distName = distOpt ? distOpt.name : '';
    setSelectedDistrictId(distId);
    setSelectedBlockId('');
    setSelectedGpId('');
    setSelectedVillageId('');

    onChange({
      state: 'Odisha',
      districtId: distId,
      districtName: distName,
      blockId: '',
      blockName: '',
      gpId: '',
      gpName: '',
      villageId: '',
      villageName: ''
    });
    setValidationErrors([]);
  };

  // Handle Block Change -> Clear GP, Village
  const handleBlockChange = (blkId: string, blkOpt?: OptionItem) => {
    const distObj = districts.find((d) => d.id === selectedDistrictId || d.name === selectedDistrictId);
    const blkName = blkOpt ? blkOpt.name : '';

    setSelectedBlockId(blkId);
    setSelectedGpId('');
    setSelectedVillageId('');

    const sel: LocationSelection = {
      state: 'Odisha',
      districtId: selectedDistrictId,
      districtName: distObj?.name || '',
      blockId: blkId,
      blockName: blkName,
      gpId: '',
      gpName: '',
      villageId: '',
      villageName: ''
    };

    onChange(sel);
    setValidationErrors([]);
    if (hideGpAndVillage && blkId) {
      validateHierarchyBackend(sel);
    }
  };

  // Handle GP Change -> Clear Village
  const handleGpChange = (gId: string, gpOpt?: OptionItem) => {
    const distObj = districts.find((d) => d.id === selectedDistrictId || d.name === selectedDistrictId);
    const blkObj = blocks.find((b) => b.id === selectedBlockId || b.name === selectedBlockId);
    const gpName = gpOpt ? gpOpt.name : '';

    setSelectedGpId(gId);
    setSelectedVillageId('');

    onChange({
      state: 'Odisha',
      districtId: selectedDistrictId,
      districtName: distObj?.name || '',
      blockId: selectedBlockId,
      blockName: blkObj?.name || '',
      gpId: gId,
      gpName: gpName,
      villageId: '',
      villageName: ''
    });
    setValidationErrors([]);
  };

  // Handle Village Change
  const handleVillageChange = (vId: string, vilOpt?: OptionItem) => {
    const distObj = districts.find((d) => d.id === selectedDistrictId || d.name === selectedDistrictId);
    const blkObj = blocks.find((b) => b.id === selectedBlockId || b.name === selectedBlockId);
    const gpObj = gps.find((g) => g.id === selectedGpId || g.name === selectedGpId);
    const vilName = vilOpt ? vilOpt.name : '';

    setSelectedVillageId(vId);

    const selection: LocationSelection = {
      state: 'Odisha',
      districtId: selectedDistrictId,
      districtName: distObj?.name || '',
      blockId: selectedBlockId,
      blockName: blkObj?.name || '',
      gpId: selectedGpId,
      gpName: gpObj?.name || '',
      villageId: vId,
      villageName: vilName
    };

    onChange(selection);
    validateHierarchyBackend(selection);
  };

  // Validate hierarchy against backend API
  const validateHierarchyBackend = async (selection: LocationSelection) => {
    setIsValidating(true);
    try {
      const res = await fetch('/api/master/validate-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selection)
      });
      const data = await res.json();
      if (!data.success && data.errors) {
        setValidationErrors(data.errors);
      } else {
        setValidationErrors([]);
      }
    } catch (e) {
      console.error('Hierarchy validation error:', e);
    } finally {
      setIsValidating(false);
    }
  };

  // Map to OptionItems for SearchableSelect
  const districtOptions: OptionItem[] = districts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    subtitle: `HQ: ${d.headquarter}`
  }));

  const blockOptions: OptionItem[] = blocks.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code
  }));

  const gpOptions: OptionItem[] = gps.map((g) => ({
    id: g.id,
    name: g.name,
    code: g.code
  }));

  const villageOptions: OptionItem[] = villages.map((v) => ({
    id: v.id,
    name: v.name,
    code: v.code,
    subtitle: v.pincode ? `PIN: ${v.pincode}` : undefined
  }));

  // Resolve human readable names for breadcrumb
  const currentDistName = districts.find((d) => d.id === selectedDistrictId || d.name === selectedDistrictId)?.name || value?.districtName;
  const currentBlockName = blocks.find((b) => b.id === selectedBlockId || b.name === selectedBlockId)?.name || value?.blockName;
  const currentGpName = gps.find((g) => g.id === selectedGpId || g.name === selectedGpId)?.name || value?.gpName;
  const currentVillageName = villages.find((v) => v.id === selectedVillageId || v.name === selectedVillageId)?.name || value?.villageName;

  return (
    <div className={`space-y-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 ${className}`}>
      {/* Header & Hierarchy Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Odisha Administrative Location Master
          </h4>
        </div>

        {/* State fixed badge */}
        <span className="text-[11px] font-mono px-2.5 py-0.5 bg-sky-100 text-sky-800 rounded-full font-bold self-start sm:self-auto">
          State: Odisha
        </span>
      </div>

      {/* Cascading Dropdowns */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${hideGpAndVillage ? '' : 'lg:grid-cols-4'} gap-3`}>
        {/* 1. District Dropdown */}
        <SearchableSelect
          id={`${idPrefix}-district`}
          label="District"
          placeholder={loadingDistricts ? 'Loading districts...' : 'Select District'}
          options={districtOptions}
          value={selectedDistrictId}
          onChange={handleDistrictChange}
          required={required}
          disabled={loadingDistricts}
        />

        {/* 2. Block Dropdown */}
        <SearchableSelect
          id={`${idPrefix}-block`}
          label="Block / Municipality"
          placeholder={
            !selectedDistrictId
              ? 'Select District first'
              : loadingBlocks
              ? 'Loading blocks...'
              : 'Select Block'
          }
          options={blockOptions}
          value={selectedBlockId}
          onChange={handleBlockChange}
          required={required}
          disabled={!selectedDistrictId || loadingBlocks}
        />

        {!hideGpAndVillage && (
          <>
            {/* 3. Gram Panchayat Dropdown */}
            <SearchableSelect
              id={`${idPrefix}-gp`}
              label="Gram Panchayat (GP)"
              placeholder={
                !selectedBlockId
                  ? 'Select Block first'
                  : loadingGps
                  ? 'Loading GPs...'
                  : 'Select GP'
              }
              options={gpOptions}
              value={selectedGpId}
              onChange={handleGpChange}
              disabled={!selectedBlockId || loadingGps}
            />

            {/* 4. Village Dropdown */}
            <SearchableSelect
              id={`${idPrefix}-village`}
              label="Village / Ward"
              placeholder={
                !selectedGpId
                  ? 'Select GP first'
                  : loadingVillages
                  ? 'Loading villages...'
                  : 'Select Village'
              }
              options={villageOptions}
              value={selectedVillageId}
              onChange={handleVillageChange}
              disabled={!selectedGpId || loadingVillages}
            />
          </>
        )}
      </div>

      {/* Live Administrative Breadcrumb */}
      {showMapPinBadge && (currentDistName || currentBlockName) && (
        <div className="mt-2 p-2.5 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-700 shadow-2xs">
          <div className="flex items-center gap-1.5 flex-wrap font-medium">
            <span className="font-bold text-sky-600">Odisha</span>
            {currentDistName && (
              <>
                <span className="text-slate-400">→</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-800">
                  {currentDistName}
                </span>
              </>
            )}
            {currentBlockName && (
              <>
                <span className="text-slate-400">→</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-800">
                  {currentBlockName}
                </span>
              </>
            )}
            {!hideGpAndVillage && currentGpName && (
              <>
                <span className="text-slate-400">→</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-800">
                  {currentGpName}
                </span>
              </>
            )}
            {!hideGpAndVillage && currentVillageName && (
              <>
                <span className="text-slate-400">→</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-800">
                  {currentVillageName}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {isValidating ? (
              <RefreshCw className="w-3.5 h-3.5 text-sky-500 animate-spin" />
            ) : validationErrors.length === 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified Hierarchy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600">
                <AlertCircle className="w-3.5 h-3.5" /> Validation Issue
              </span>
            )}
          </div>
        </div>
      )}

      {/* Validation Errors Banner */}
      {showValidationBanner && validationErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Invalid Location Combination Detected:
          </p>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
