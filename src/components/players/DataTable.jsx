import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Filter, Settings, Download, X, Loader,
  ChevronLeft, ChevronRight, Check, Eye, ExternalLink,
  RotateCw, RotateCcw, ZoomIn, ZoomOut, Maximize, MoreVertical,
  Users, ArrowUpDown, ChevronDown, Calendar, FilterX, Edit, Trash2, Upload
} from 'lucide-react';
import { playerService } from '../../services/playerService';
import { teamService } from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';
import { FULL_MEMBERS, ASSOCIATE_MEMBERS, OTHER_FULL_MEMBERS, COUNTRY_LIST } from '../../pages/PlayerRegistration';
import regStyles from '../../pages/PlayerRegistration.module.css';
import styles from './DataTable.module.css';
import DatePicker from '../ui/DatePicker';
import { formatValue } from '../../utils/formatters';

const DataTable = ({ onViewDetails, customCheckoutParam = null, isTeamView = false, externalFilters = {}, dashboardMode = false, onEOIChange = null }) => {
  const extractLink = (val) => {
    if (typeof val !== 'string') return null;
    const match = val.match(/(https?:\/\/[^\s]+)/i);
    return match ? match[0] : (val.startsWith('www.') ? `https://${val}` : null);
  };

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Edit & Delete States
  const [editPlayerModalOpen, setEditPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [deletePlayerRef, setDeletePlayerRef] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tableAlertModal, setTableAlertModal] = useState({ isOpen: false, message: '' });
  const [isEditingSaving, setIsEditingSaving] = useState(false);
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editVerifiedCategory, setEditVerifiedCategory] = useState(null);

  const [fileModalUrl, setFileModalUrl] = useState(null);
  const [fileModalLoading, setFileModalLoading] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const { user, league, preferences, updatePreference } = useAuth();
  const [activeTab, setActiveTab] = useState('player'); // 'player' or 'staff'
  const isInitializing = useRef(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Track whether we've already applied the server preferences for this user+tab
  // to avoid infinite re-runs when updatePreference changes the context
  const preferencesApplied = useRef({});

  // Dynamic States
  const [availableColumns, setAvailableColumns] = useState([]);
  const [availableFilters, setAvailableFilters] = useState([{ key: 'search', label: 'Global Search', type: 'search' }]);

  const initialFilterState = { page: 1, pageSize: 25, search: '', sortBy: '', sortOrder: 'asc' };
  const [filtersByTab, setFiltersByTab] = useState({
    player: { ...initialFilterState },
    staff: { ...initialFilterState }
  });

  const filters = filtersByTab[activeTab] || initialFilterState;

  const setFilters = (updater) => {
    setFiltersByTab(prev => {
      const currentTabFilters = prev[activeTab] || initialFilterState;
      const nextFilters = typeof updater === 'function' ? updater(currentTabFilters) : updater;
      return { ...prev, [activeTab]: nextFilters };
    });
  };
  const [visibleFilters, setVisibleFilters] = useState({ search: true });
  const [visibleColumns, setVisibleColumns] = useState({});

  // Dropdowns
  const [activeSelect, setActiveSelect] = useState(null); // Track which custom select is open
  const customSelectRef = useRef(null);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterDropdownSearch, setFilterDropdownSearch] = useState('');
  const filterDropdownRef = useRef(null);

  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const columnDropdownRef = useRef(null);

  // Fetch API Schema and analyze data for filters
  useEffect(() => {
    const initializeSchema = async () => {
      isInitializing.current = true;
      setLoading(true);

      // Clear previous visibility to avoid ghosting during transition
      setVisibleColumns({});
      setVisibleFilters({ search: true });

      try {
        const checkoutParam = customCheckoutParam || (activeTab === 'staff' ? league?.staffParams : league?.params);
        const keys = await playerService.getKeys(checkoutParam);
        if (keys && keys.length > 0) {
          // Map keys, replacing only 'id' with a virtual index key
          const cols = keys.map(k => {
            if (k.toLowerCase() === 'id' || k.toLowerCase() === 'autoid') {
              return { key: '__index__', label: '#' };
            }
            return { key: k, label: k };
          });

          // Move url/link columns to the end
          const sortedCols = [
            ...cols.filter(c => !c.key.toLowerCase().includes('url') && !c.key.toLowerCase().includes('link')),
            ...cols.filter(c => c.key.toLowerCase().includes('url') || c.key.toLowerCase().includes('link'))
          ];

          setAvailableColumns(sortedCols);

          const allPlayersRes = await playerService.getPlayers({ pageSize: 1000 }, checkoutParam); // Large enough but reasonable
          const allPlayers = allPlayersRes.data || [];

          const filterDefs = [{ key: 'search', label: 'Global Search', type: 'search' }];

          keys.forEach(k => {
            if (k.toLowerCase() === 'id' || k.toLowerCase() === 'autoid') return;
            const label = k.toLowerCase();
            const isDate = label.includes('date') || label.includes('dob') || label.includes('created') || label.includes('updated');

            if (isDate) {
              filterDefs.push({ key: k, label: k, type: 'date' });
            } else {
              let validEntriesCount = 0;
              const valueCounts = allPlayers.reduce((acc, p) => {
                let val = p[k];

                if (val !== undefined && val !== null) {
                  val = String(val).trim();

                  if (val !== '') {
                    validEntriesCount++;
                    acc[val] = (acc[val] || 0) + 1;
                  }
                }
                return acc;
              }, {});

              const allUniqueValues = Object.keys(valueCounts).filter(v => v.length > 0);

              // Skip if there's only 0 or 1 unique value (no filtering utility)
              if (allUniqueValues.length <= 1) return;

              let isCategorical = false;
              if (allUniqueValues.length > 0 && allUniqueValues.length <= 40) {
                const uniquenessRatio = validEntriesCount > 0 ? (allUniqueValues.length / validEntriesCount) : 1;
                // Dynamically mark as dropdown if the cardinality ratio is low (< 70% unique) 
                // OR if it's a binary/unary field (length <= 2)
                if (uniquenessRatio < 0.7 || allUniqueValues.length <= 2) {
                  isCategorical = true;
                }
              }

              let optionsList = allUniqueValues;
              if (k.toLowerCase().includes('team_names') || k.toLowerCase().includes('team_ids') || k.toLowerCase().includes('team_name')) {
                const individualValues = new Set();
                allUniqueValues.forEach(valStr => {
                  valStr.split(',').forEach(s => {
                    const trimmed = s.trim();
                    if (trimmed) individualValues.add(trimmed);
                  });
                });
                optionsList = Array.from(individualValues);
                isCategorical = true;
              }

              if (isCategorical) {
                filterDefs.push({
                  key: k,
                  label: k,
                  type: 'select',
                  options: optionsList.sort()
                });
              } else {
                filterDefs.push({ key: k, label: k, type: 'text' });
              }
            }
          });

          setAvailableFilters(filterDefs);

          const initialVisCols = {};
          const initialVisFilters = { search: true };

          // Available filters use the original keys, but columns are sortedCols
          // availableColumns state is sortedCols
          const currentCols = sortedCols;

          const isTeam = isTeamView || user?.isTeam;

          currentCols.forEach((col, index) => {
            const kLow = col.key.toLowerCase();
            const labelLow = col.label.toLowerCase();
            const isIndex = col.key === '__index__';

            if (dashboardMode) {
              const isDashboardCol = (
                isIndex ||
                kLow.includes('firstname') || labelLow.includes('firstname') || kLow.includes('first_name') ||
                kLow.includes('lastname') || labelLow.includes('lastname') || kLow.includes('surname') ||
                kLow === 'eoi' || labelLow === 'eoi' ||
                kLow === 'country' || labelLow === 'country' || kLow === 'selectednation' ||
                kLow === 'member_type' || labelLow === 'member_type' || kLow === 'selectedmember' ||
                kLow.includes('profile_link') || kLow.includes('profile') || labelLow.includes('profile')
              );
              initialVisCols[col.key] = isDashboardCol;
            } else {
              const isGender = labelLow.includes('gender');
              const isTeamDefaultCol = isTeam && (
                kLow === 'eoi' || labelLow === 'eoi' ||
                kLow === 'country' || labelLow === 'country' || kLow === 'selectednation' ||
                kLow === 'member_type' || labelLow === 'member_type' || kLow === 'selectedmember' ||
                kLow.includes('profile_link') || kLow.includes('profile') || labelLow.includes('profile')
              );

              // Always show Index, Gender, or Team Default columns by default; all others by position
              if (isIndex || isGender || isTeamDefaultCol) {
                initialVisCols[col.key] = true;
              } else {
                initialVisCols[col.key] = index < 6;
              }
            }

            const isEOIFilter = kLow === 'eoi';
            if (isEOIFilter && (isTeam || customCheckoutParam === 'getEOIPlayers')) {
              initialVisFilters[col.key] = true;
            } else {
              initialVisFilters[col.key] = false;
            }
          });

          let finalVisCols = initialVisCols;
          let finalVisFilters = initialVisFilters;

          if (user && user.username && !dashboardMode) {
            try {
              // Read from in-memory context — zero latency, no API call needed here
              const prefKey = `${user.username}_${activeTab}`;
              const fallbackKey = user.username;
              const userPrefsStr = preferences[prefKey] || preferences[fallbackKey];
              const parsedPrefs = userPrefsStr
                ? (typeof userPrefsStr === 'string' ? JSON.parse(userPrefsStr) : userPrefsStr)
                : null;

              if (parsedPrefs) {
                const colsArray = parsedPrefs.c || parsedPrefs.columns;
                const filsArray = parsedPrefs.f || parsedPrefs.filters;

                if (Array.isArray(colsArray)) {
                  // Restore exactly what was saved — no columns are force-added
                  finalVisCols = colsArray.reduce((acc, col) => ({ ...acc, [col]: true }), {});
                } else if (colsArray && typeof colsArray === 'object') {
                  finalVisCols = colsArray;
                }

                if (Array.isArray(filsArray)) {
                  finalVisFilters = filsArray.reduce((acc, col) => ({ ...acc, [col]: true }), { search: true });
                } else if (filsArray && typeof filsArray === 'object') {
                  finalVisFilters = { search: true, ...filsArray };
                }
              }
            } catch (e) {
              console.error("Failed to parse preferences from context:", e);
            }
          }

          setVisibleColumns(finalVisCols);
          setVisibleFilters(finalVisFilters);
        }
      } catch (err) {
        console.error("Failed to fetch schema keys:", err);
      } finally {
        setLoading(false);
        // Delay resetting the initialization flag slightly to ensure effects have had a chance to react 
        // to the setVisibleColumns/setVisibleFilters calls BEFORE the next save effect fires
        setTimeout(() => {
          isInitializing.current = false;
        }, 100);
      }
    };
    initializeSchema();
  }, [user, activeTab, league, refreshTrigger]); // Re-initialize schema if user, tab, league, or refreshTrigger changes

  // Apply server preferences once they arrive in context (after initial server load)
  // This runs when preferences first populates from AuthContext, without looping on saves
  const prevPreferenceRef = useRef(null);
  useEffect(() => {
    if (!user?.username || !availableColumns.length) return;
    const prefKey = `${user.username}_${activeTab}`;
    const currentPref = preferences[prefKey] || preferences[user.username];
    // Only re-apply if the preference for this key has changed since we last checked
    if (currentPref === prevPreferenceRef.current) return;
    prevPreferenceRef.current = currentPref;
    if (!currentPref) return;

    // If we are still initializing, let initializeSchema handle it
    if (isInitializing.current) return;

    try {
      const parsedPrefs = typeof currentPref === 'string' ? JSON.parse(currentPref) : currentPref;
      if (!parsedPrefs) return;

      const colsArray = parsedPrefs.c || parsedPrefs.columns;
      const filsArray = parsedPrefs.f || parsedPrefs.filters;

      isInitializing.current = true;
      if (Array.isArray(colsArray)) {
        // Restore exactly what was saved — no columns are force-added
        setVisibleColumns(colsArray.reduce((acc, col) => ({ ...acc, [col]: true }), {}));
      }
      if (Array.isArray(filsArray)) {
        setVisibleFilters(filsArray.reduce((acc, col) => ({ ...acc, [col]: true }), { search: true }));
      }
      setTimeout(() => { isInitializing.current = false; }, 100);
    } catch (e) {
      console.error('Failed to apply server preferences:', e);
    }
  }, [preferences, user, activeTab, availableColumns]);

  useEffect(() => {
    if (isInitializing.current) return;
    if (user && user.username && Object.keys(visibleColumns).length > 0) {
      const activeColumns = Object.keys(visibleColumns).filter(k => visibleColumns[k]);
      const activeFilters = Object.keys(visibleFilters).filter(k => visibleFilters[k]);
      const prefKey = `${user.username}_${activeTab}`;

      // Update context immediately (in-memory) + background save to server
      updatePreference(prefKey, { c: activeColumns, f: activeFilters });
    }
  }, [visibleColumns, visibleFilters, user, activeTab]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) setShowColumnDropdown(false);
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) setShowFilterDropdown(false);
      if (customSelectRef.current && !customSelectRef.current.contains(event.target)) setActiveSelect(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extractCricinfoPlayerId = (url) => {
    if (!url) return null;
    try {
      const trimmed = url.trim();
      const parsed = new URL(trimmed);
      const validHostnames = ['www.cricinfo.com', 'cricinfo.com', 'www.espncricinfo.com', 'espncricinfo.com'];
      if (!validHostnames.includes(parsed.hostname)) {
        return null;
      }
      const match = parsed.pathname.match(/-(\d+)\/?$/);
      return match ? match[1] : null;
    } catch (e) {
      return null;
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const uploadFileToS3 = async (file) => {
    if (!file || !(file instanceof File)) return "";

    const cleanFileName = file.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');

    let cleanFileType = file.type;
    if (!cleanFileType) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') {
        cleanFileType = 'image/jpeg';
      } else if (ext === 'png') {
        cleanFileType = 'image/png';
      } else if (ext === 'pdf') {
        cleanFileType = 'application/pdf';
      } else {
        cleanFileType = 'application/octet-stream';
      }
    }

    const userdetails = {
      fileName: cleanFileName,
      fileType: cleanFileType,
      FirstName: "",
      MiddleName: "",
      Surname: "",
      Mobile: "",
      DOB: "",
      Email: "",
      State: "",
      TrialCity: "",
      TrialZone: "",
      PlayingRoles: "",
      BattingHandedness: "",
      PreferredBowlingStyle: "",
      PreferredBattingOrders: "",
      Checkout: "file"
    };

    try {
      const signedUrlRes = await fetch(
        "https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userdetails),
        }
      );

      const data = await signedUrlRes.json();
      if (!data || data.body === undefined) {
        throw new Error("Lambda response body is undefined");
      }

      const responseJson = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      const { signedUrl, key } = responseJson;

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        mode: "cors",
        headers: { "Content-Type": cleanFileType },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("S3 Upload failed");
      }

      return key;
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error(`Failed to upload ${file.name}: ${err.message || err}`);
    }
  };

  const [editConfirmModal, setEditConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null, onCancel: null });
  const triggerEditConfirmModal = (msg, onConf, onCanc) => {
    setEditConfirmModal({ isOpen: true, message: msg, onConfirm: onConf, onCancel: onCanc });
  };

  const handleEditClick = (player) => {
    const nation = player.Country || player.SelectedNation || "";
    const isAfgIre = nation === 'Afghanistan' || nation === 'Ireland';
    setEditingPlayer({
      FirstName: player.FirstName || "",
      MiddleName: player.MiddleName || "",
      Surname: player.SurName || player.Surname || "",
      Mobile: player.MobileNumber || player.Mobile || "",
      DOB: player.DateofBirth || player.DOB ? String(player.DateofBirth || player.DOB).split("T")[0] : "",
      Email: player.Email || "",
      State: player.State || "",
      TrialCity: player.TrialCity || "",
      TrialZone: player.TrialZone || "",
      PlayingRoles: player.PlayingRoles || "",
      BattingHandedness: player.BattingHandedness || "",
      PreferredBowlingStyle: player.PreferredBowlingStyle || "",
      PreferredBattingOrders: player.PreferredBattingOrder || player.PreferredBattingOrders || "",
      ReferenceNo: player.ReferenceNo || player.referenceNo || "",
      SelectedMember: player.Member_Type || player.SelectedMember || "",
      SelectedNation: nation,
      CricinfoLink: player.Profile_link || player.CricinfoLink || "",
      ReservedPrice: player.Reserve_Price !== undefined ? String(player.Reserve_Price) : String(player.ReservedPrice || ""),
      passporturl: player.Passport_link || player.passporturl || "",
      gccurl: player.GCC_link || player.gccurl || "",
      AgentId: player.AgentId || "",
      Availability: player.Availability ? player.Availability.toLowerCase() : "",
      FromDate: player.FromDate ? String(player.FromDate).split("T")[0] : "",
      ToDate: player.ToDate ? String(player.ToDate).split("T")[0] : "",
      Reason: player.Reason || "",
      isPlayerValidation: player.isPlayerValidation || 0,
      PlayerValidated: player.PlayerValidated || 0,
      isCricInfolink: player.isCricInfolink || 0,
      IsEligibleUAEplayer: player.IsEligibleUAEplayer || 0,
      PerMatchFee: player.PerMatchFee !== undefined ? String(player.PerMatchFee) : "",
      emiratesidurl: player.EmiratesIdURL || player.emiratesidurl || "",
      CountryCode: player.CountryCode || "",
      passportFile: null,
      emiratesidFile: null
    });
    setEditIsVerified(isAfgIre);
    setEditVerifiedCategory(null);
    setEditPlayerModalOpen(true);
  };

  const verifyEditProfileUrl = async () => {
    if (!editingPlayer.CricinfoLink.trim()) {
      setTableAlertModal({ isOpen: true, message: "Please enter a valid Cricinfo Profile URL." });
      return;
    }
    const playerId = extractCricinfoPlayerId(editingPlayer.CricinfoLink);
    if (!playerId) {
      setTableAlertModal({ isOpen: true, message: "Invalid Cricinfo URL. Please make sure the domain is www.espncricinfo.com or www.cricinfo.com and contains player ID at the end." });
      return;
    }
    try {
      const response = await fetch(`https://cloud.cricket-21.com/OtherSportsApi/cricket/category/${playerId}`);
      const data = await response.json();
      if (data && data.success) {
        const cat = data.category;
        setEditVerifiedCategory(cat);
        setEditIsVerified(true);
        let newReserve = "10000";
        let newFee = "1000";
        if (cat === 'A') {
          newReserve = "80000";
          newFee = "8000";
        } else if (cat === 'B') {
          newReserve = "40000";
          newFee = "4000";
        } else if (cat === 'C') {
          newReserve = "10000";
          newFee = "1000";
        }
        setEditingPlayer(prev => ({
          ...prev,
          ReservedPrice: newReserve,
          PerMatchFee: newFee
        }));
        let eligiblePrice = "10,000";
        if (cat === 'A') eligiblePrice = "80,000";
        if (cat === 'B') eligiblePrice = "40,000";
        setTableAlertModal({ isOpen: true, message: `Verification successful! Based on Category ${cat}, you are eligible for USD $${eligiblePrice}.` });
      } else {
        setTableAlertModal({ isOpen: true, message: "Verification failed. Player category could not be retrieved." });
      }
    } catch (error) {
      console.error(error);
      setTableAlertModal({ isOpen: true, message: "An error occurred while verifying the profile URL." });
    }
  };

  const handleEditSave = async () => {
    if (!editingPlayer.FirstName.trim()) return setTableAlertModal({ isOpen: true, message: "Please enter First Name." });
    if (!editingPlayer.Surname.trim()) return setTableAlertModal({ isOpen: true, message: "Please enter Last Name." });
    if (!editingPlayer.Mobile.trim()) return setTableAlertModal({ isOpen: true, message: "Please enter Mobile Number." });
    if (!/^\d{7,10}$/.test(editingPlayer.Mobile.trim())) return setTableAlertModal({ isOpen: true, message: "Mobile Number must be between 7 to 10 digits." });
    if (!editingPlayer.DOB) return setTableAlertModal({ isOpen: true, message: "Please select Date of Birth." });
    if (!editingPlayer.Email.trim()) return setTableAlertModal({ isOpen: true, message: "Please enter Email." });

    const isAfgOrIreEditing = editingPlayer.SelectedNation === 'Afghanistan' || editingPlayer.SelectedNation === 'Ireland' || editingPlayer.SelectedMember === 'Afghanistan' || editingPlayer.SelectedMember === 'Ireland';
    if (isAfgOrIreEditing && !editIsVerified) {
      return setTableAlertModal({ isOpen: true, message: "please enter the cricinfo profile to verify your base price" });
    }

    if (!editingPlayer.ReservedPrice) return setTableAlertModal({ isOpen: true, message: "Please select a Reserve Price." });

    setIsEditingSaving(true);
    try {
      let updatedPassportUrl = editingPlayer.passporturl;
      let updatedEmiratesidUrl = editingPlayer.emiratesidurl;

      if (editingPlayer.passportFile) {
        updatedPassportUrl = await uploadFileToS3(editingPlayer.passportFile);
      }
      if (editingPlayer.emiratesidFile) {
        updatedEmiratesidUrl = await uploadFileToS3(editingPlayer.emiratesidFile);
      }

      const payload = {
        ...editingPlayer,
        passporturl: updatedPassportUrl,
        emiratesidurl: updatedEmiratesidUrl
      };
      delete payload.passportFile;
      delete payload.emiratesidFile;

      const res = await playerService.editPlayer(payload);
      if (res.success) {
        setTableAlertModal({ isOpen: true, message: "ILT Player updated successfully" });
        setEditPlayerModalOpen(false);
        setEditingPlayer(null);
        playerService.clearCache();
        fetchPlayers();
      } else {
        setTableAlertModal({ isOpen: true, message: res.message || "Failed to update ILT Player" });
      }
    } catch (err) {
      console.error(err);
      setTableAlertModal({ isOpen: true, message: err.message || "An error occurred while saving player." });
    } finally {
      setIsEditingSaving(false);
    }
  };

  const handleDeleteClick = (player) => {
    setDeletePlayerRef(player.ReferenceNo || player.referenceNo);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePlayer = async () => {
    if (!deletePlayerRef) return;
    try {
      const res = await playerService.deletePlayer(deletePlayerRef);
      if (res.success) {
        setTableAlertModal({ isOpen: true, message: res.message || "ILT Player deleted successfully" });
        playerService.clearCache();
        fetchPlayers();
      } else {
        setTableAlertModal({ isOpen: true, message: res.message || "Player deletion failed" });
      }
    } catch (err) {
      console.error(err);
      setTableAlertModal({ isOpen: true, message: "An error occurred while deleting player." });
    } finally {
      setShowDeleteConfirm(false);
      setDeletePlayerRef(null);
    }
  };

  const handleEditClassificationChange = (val) => {
    setEditingPlayer(prev => {
      const isAfgIre = val === 'Afghanistan' || val === 'Ireland';
      return {
        ...prev,
        SelectedMember: val,
        SelectedNation: isAfgIre ? val : "",
        ReservedPrice: "",
        PerMatchFee: "",
        CricinfoLink: isAfgIre ? prev.CricinfoLink : "",
        isCricInfolink: isAfgIre ? 1 : prev.isCricInfolink
      };
    });
    setEditIsVerified(false);
    setEditVerifiedCategory(null);
  };

  const handleEditNationChange = (val) => {
    setEditingPlayer(prev => {
      const isAfgIre = val === 'Afghanistan' || val === 'Ireland';
      return {
        ...prev,
        SelectedNation: val,
        SelectedMember: isAfgIre ? val : prev.SelectedMember,
        ReservedPrice: "",
        PerMatchFee: "",
        CricinfoLink: isAfgIre ? prev.CricinfoLink : "",
        isCricInfolink: isAfgIre ? 1 : prev.isCricInfolink
      };
    });
    setEditIsVerified(false);
    setEditVerifiedCategory(null);
  };

  const handleEditReservePriceChange = (val) => {
    const nation = editingPlayer.SelectedNation || editingPlayer.SelectedMember;
    const isAfgIre = nation === 'Afghanistan' || nation === 'Ireland';
    if (isAfgIre) {
      if (editingPlayer.isCricInfolink === 1) {
        if (!editIsVerified) {
          setTableAlertModal({ isOpen: true, message: "please enter the cricinfo profile to verify your base price" });
          return;
        }
        if (editVerifiedCategory === 'C' && val !== '10000') return;
        if (editVerifiedCategory === 'B' && val === '80000') return;
      } else {
        if (val === '40000') {
          triggerEditConfirmModal(
            "The player must have been capped at international level and or have played in DP World ILT20 previously.",
            () => {
              setEditingPlayer(prev => ({ ...prev, ReservedPrice: '40000', PerMatchFee: '4000' }));
              setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null });
            },
            () => { setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null }); }
          );
          return;
        } else if (val === '80000') {
          triggerEditConfirmModal(
            "They must have been capped 100 or more times at international level (may be cumulative across Tests, ODI and IT20).",
            () => {
              setEditingPlayer(prev => ({ ...prev, ReservedPrice: '80000', PerMatchFee: '8000' }));
              setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null });
            },
            () => { setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null }); }
          );
          return;
        }
      }
    }
    let feeVal = "8000";
    if (val === "10000") feeVal = "1000";
    else if (val === "20000") feeVal = "2000";
    else if (val === "40000") feeVal = "4000";
    setEditingPlayer(prev => ({
      ...prev,
      ReservedPrice: val,
      PerMatchFee: feeVal
    }));
  };

  const handleEditPerMatchFeeChange = (val) => {
    const nation = editingPlayer.SelectedNation || editingPlayer.SelectedMember;
    const isAfgIre = nation === 'Afghanistan' || nation === 'Ireland';
    if (isAfgIre) {
      if (editingPlayer.isCricInfolink === 1) {
        if (!editIsVerified) {
          setTableAlertModal({ isOpen: true, message: "please enter the cricinfo profile to verify your base price" });
          return;
        }
        if (editVerifiedCategory === 'C' && val !== '1000') return;
        if (editVerifiedCategory === 'B' && val === '8000') return;
      } else {
        if (val === '4000') {
          triggerEditConfirmModal(
            "The player must have been capped at international level and or have played in DP World ILT20 previously.",
            () => {
              setEditingPlayer(prev => ({ ...prev, ReservedPrice: '40000', PerMatchFee: '4000' }));
              setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null });
            },
            () => { setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null }); }
          );
          return;
        } else if (val === '8000') {
          triggerEditConfirmModal(
            "The player must have been capped 100 or more times at international level (may be cumulative across Tests, ODI and IT20).",
            () => {
              setEditingPlayer(prev => ({ ...prev, ReservedPrice: '80000', PerMatchFee: '8000' }));
              setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null });
            },
            () => { setEditConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null }); }
          );
          return;
        }
      }
    }
    let reserveVal = "80000";
    if (val === "1000") reserveVal = "10000";
    else if (val === "2000") reserveVal = "20000";
    else if (val === "4000") reserveVal = "40000";
    setEditingPlayer(prev => ({
      ...prev,
      PerMatchFee: val,
      ReservedPrice: reserveVal
    }));
  };

  const handleToggleEOI = async (player, newStatus) => {
    const savedLogin = localStorage.getItem('player_registry_login_data');
    const loginData = savedLogin ? JSON.parse(savedLogin) : null;
    const teamId = user?.teamId || user?.Team_Id || loginData?.teamData?.Team_Id || loginData?.Team_Id || user?.id;
    const playerId = player.ID || player.Id || player.id;

    if (!playerId) {
      console.error("Missing Player_Id for EOI action:", player);
      return;
    }
    if (!teamId) {
      setTableAlertModal({ isOpen: true, message: "Team ID is missing. Please re-login." });
      return;
    }

    // Optimistic local state update in memory
    setPlayers(prev => prev.map(p => {
      if (String(p.ID || p.Id || p.id) === String(playerId)) {
        return { ...p, EOI: newStatus };
      }
      return p;
    }));

    // Update in-memory playerService cache so tab switching does not revert to stale cached data
    playerService.updateCachedPlayer(playerId, { EOI: newStatus });

    if (onEOIChange) {
      onEOIChange(playerId, newStatus);
    }

    try {
      if (newStatus === 1) {
        await teamService.createPlayerEOI({ playerId, teamId });
      } else {
        await teamService.deletePlayerEOI({ playerId, teamId });
      }
    } catch (err) {
      console.error("Failed to update player EOI:", err);
      // Rollback local state and cache on error
      setPlayers(prev => prev.map(p => {
        if (String(p.ID || p.Id || p.id) === String(playerId)) {
          return { ...p, EOI: newStatus === 1 ? 0 : 1 };
        }
        return p;
      }));
      playerService.updateCachedPlayer(playerId, { EOI: newStatus === 1 ? 0 : 1 });
      if (onEOIChange) {
        onEOIChange(playerId, newStatus === 1 ? 0 : 1);
      }
      setTableAlertModal({ isOpen: true, message: err.message || "Failed to update EOI status." });
    }
  };

  const fetchPlayers = async () => {
    if (availableColumns.length === 0) return;
    setLoading(true);
    try {
      const payload = { ...filters, ...(externalFilters || {}), __types: availableFilters || [] };
      const checkoutParam = customCheckoutParam || (activeTab === 'staff' ? league?.staffParams : league?.params);
      const res = await playerService.getPlayers(payload, checkoutParam);
      setPlayers(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Failed to fetch player data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, [filters, availableColumns, JSON.stringify(externalFilters)]);

  const handleViewFile = async (fileKey) => {
    if (!fileKey) return;
    setShowFileModal(true);
    setFileModalLoading(true);
    setFileModalUrl(null);
    setZoom(1);
    setRotation(0);

    const userdetails = {
      FirstName: "", MiddleName: "", Surname: "", Mobile: "",
      DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
      PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
      PreferredBattingOrders: "", Checkout: "download", key: fileKey
    };

    try {
      const res = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userdetails)
      });
      const data = await res.json();
      const parsed = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      setFileModalUrl(parsed.url);
    } catch (err) {
      console.error("Failed to fetch file URL:", err);
    } finally {
      setFileModalLoading(false);
    }
  };

  const handleDownload = async (e) => {
    if (e) e.preventDefault();
    if (!fileModalUrl) return;

    // Extract a clean filename from the presigned S3 URL (strip query params)
    const filename = fileModalUrl.split('/').pop().split('?')[0] || 'download';

    try {
      // The presigned URL already contains auth credentials baked in.
      // Fetch it directly as a blob — cross-origin fetch is allowed because
      // S3 presigned URLs include all necessary credentials in the URL itself.
      const response = await fetch(fileModalUrl);
      if (!response.ok) throw new Error(`Direct fetch failed: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename; // Forces Save-As dialog in all browsers
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      // Fallback: if CORS blocks the direct fetch, route through the proxy
      // Works in dev (Vite plugin) AND production (server.js handler)
      console.warn('Direct download blocked (CORS?), falling back to proxy:', err);
      try {
        const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
        const proxyUrl = `${base}/api/proxy-download?url=${encodeURIComponent(fileModalUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy fetch failed: ${response.status}`);

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (proxyErr) {
        console.error('Download failed (both direct and proxy):', proxyErr);
      }
    }
  };


  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  };

  const handleReset = () => {
    const resetState = { search: '', page: 1, pageSize: filters.pageSize, sortBy: filters.sortBy, sortOrder: filters.sortOrder };
    availableColumns.forEach(c => resetState[c.key] = '');
    setFilters(resetState);
  };

  const handleExport = async () => {
    try {
      // Ignore current filters and fetch all records
      const exportFilters = { page: 1, pageSize: 100000, __types: availableFilters };
      const res = await playerService.getPlayers(exportFilters);
      const exportData = res.data || [];

      // Export all available columns, ignoring toggled visibility
      const allColsArr = availableColumns;

      const leagueName = user && user.leagueId ? user.leagueId.toUpperCase() : 'Export';
      playerService.exportToExcel(exportData, allColsArr, `${leagueName}_All_Players`);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleRefresh = async () => {
    playerService.clearCache();
    setRefreshTrigger(prev => prev + 1);
  };

  const removeFilter = (key) => {
    setVisibleFilters(prev => ({ ...prev, [key]: false }));
    setFilters(prev => ({ ...prev, [key]: '', page: 1 }));
  };

  // Pagination Logic
  const totalPages = Math.ceil(total / filters.pageSize);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, filters.page - 2);
      let end = Math.min(totalPages, filters.page + 2);

      if (start === 1) end = maxVisiblePages;
      if (end === totalPages) start = totalPages - maxVisiblePages + 1;

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    // Persist table state when switching categories - no longer resetting filters
    setPlayers([]);
    setAvailableColumns([]);
  };

  return (
    <div className={styles.datatableWrapper}>
      <div className={styles.filterBar}>
        <div className={styles.filterControlsRow}>
          {availableFilters.map(filterDef => {
            if (!visibleFilters[filterDef.key]) return null;

            const renderFilter = () => {
              if (filterDef.type === 'search') {
                return (
                  <div className={`${styles.filterInputWrapper} ${styles.large}`}>
                    {/* <Search size={14} className={styles.searchIcon} /> */}
                    <input
                      type="text"
                      placeholder="Search globally..."
                      className={`input-field ${styles.searchField}`}
                      value={filters.search}
                      onChange={(e) => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))}
                    />
                    {filters.search && (
                      <button
                        className={styles.clearSearchBtn}
                        onClick={() => setFilters(p => ({ ...p, search: '', page: 1 }))}
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              } else if (filterDef.type === 'select') {
                const currentValue = filters[filterDef.key] !== undefined && filters[filterDef.key] !== null ? String(filters[filterDef.key]) : '';
                const isOpen = activeSelect === filterDef.key;
                const isEOIKey = filterDef.key.toLowerCase() === 'eoi';

                const formatOptionLabel = (val) => {
                  if (val === '' || val === null || val === undefined) return 'All';
                  if (isEOIKey) {
                    if (String(val) === '0') return 'Mark as Interested';
                    if (String(val) === '1') return 'Interested';
                  }
                  return val;
                };

                return (
                  <div
                    className={styles.filterInputWrapper}
                    ref={isOpen ? customSelectRef : null}
                  >
                    <div
                      className={`${styles.customSelectTrigger} ${currentValue ? styles.hasValue : ''}`}
                      onClick={() => setActiveSelect(isOpen ? null : filterDef.key)}
                    >
                      <span className={styles.selectLabel}>
                        {formatOptionLabel(currentValue)}
                      </span>
                      <div className={styles.triggerActions}>
                        {currentValue && (
                          <button
                            className={styles.clearTriggerBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilters(p => ({ ...p, [filterDef.key]: '', page: 1 }));
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                        <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`} />
                      </div>
                    </div>

                    {isOpen && (
                      <div className={`card glass ${styles.customSelectOptions}`}>
                        <div
                          className={`${styles.customOption} ${!currentValue ? styles.activeOption : ''}`}
                          onClick={() => {
                            setFilters(p => ({ ...p, [filterDef.key]: '', page: 1 }));
                            setActiveSelect(null);
                          }}
                        >
                          All
                        </div>
                        {filterDef.options.map(opt => (
                          <div
                            key={opt}
                            className={`${styles.customOption} ${String(currentValue) === String(opt) ? styles.activeOption : ''}`}
                            onClick={() => {
                              setFilters(p => ({ ...p, [filterDef.key]: opt, page: 1 }));
                              setActiveSelect(null);
                            }}
                          >
                            {formatOptionLabel(opt)}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      className={styles.removeFilterBtn}
                      onClick={() => removeFilter(filterDef.key)}
                      title="Remove filter"
                    >
                      <FilterX size={14} />
                    </button>
                  </div>
                );
              } else if (filterDef.type === 'date') {
                return (
                  <div className={styles.filterInputWrapper}>
                    <DatePicker
                      value={filters[filterDef.key] || ''}
                      onChange={(val) => setFilters(p => ({ ...p, [filterDef.key]: val, page: 1 }))}
                      placeholder="Select Date"
                    />
                    <button
                      className={styles.removeFilterBtn}
                      onClick={() => removeFilter(filterDef.key)}
                      title="Remove filter"
                    >
                      <FilterX size={14} />
                    </button>
                  </div>
                );
              } else {
                return (
                  <div className={styles.filterInputWrapper}>
                    <input
                      type="text"
                      placeholder={`Search...`}
                      className={`input-field ${styles.genericField}`}
                      value={filters[filterDef.key] || ''}
                      onChange={(e) => setFilters(p => ({ ...p, [filterDef.key]: e.target.value, page: 1 }))}
                    />
                    {filters[filterDef.key] && (
                      <button
                        className={styles.clearSearchBtn}
                        onClick={() => setFilters(p => ({ ...p, [filterDef.key]: '', page: 1 }))}
                        title="Clear filter"
                        style={{ right: '15px' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      className={styles.removeFilterBtn}
                      onClick={() => removeFilter(filterDef.key)}
                      title="Remove filter"
                    >
                      <FilterX size={14} />
                    </button>
                  </div>
                );
              }
            };

            return (
              <div key={filterDef.key} className={styles.filterItem}>
                <label className={styles.filterLabel}>{filterDef.label}</label>
                {renderFilter()}
              </div>
            );
          })}
        </div>

        <div className={styles.controlsGroup}>
          <div ref={filterDropdownRef} className={styles.dropdownButtonWrapper}>
            <button
              className={`btn btn-outline ${styles.dropdownBtn}`}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              title="Filter settings"
            >
              <Filter size={18} />
            </button>

            {showFilterDropdown && (
              <div className={`card glass ${styles.dropdownContainer}`}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownSearchWrapper}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search filters..."
                      className={`input-field ${styles.dropdownSearchInput}`}
                      value={filterDropdownSearch}
                      onChange={(e) => setFilterDropdownSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.dropdownSectionTitle}>FILTERS</div>

                <div className={styles.dropdownList}>
                  {availableFilters
                    .filter(col => !col.label.toLowerCase().includes('url') && !col.label.toLowerCase().includes('link'))
                    .filter(col => col.label.toLowerCase().includes(filterDropdownSearch.toLowerCase()))
                    .map(filterDef => (
                      <div
                        key={filterDef.key}
                        className={styles.dropdownItemRow}
                        onClick={() => {
                          setVisibleFilters(prev => {
                            const next = { ...prev, [filterDef.key]: !prev[filterDef.key] };
                            if (!next[filterDef.key]) {
                              setFilters(f => ({ ...f, [filterDef.key]: '', page: 1 }));
                            }
                            return next;
                          });
                        }}
                      >
                        <div className={`${styles.checkboxBox} ${visibleFilters[filterDef.key] ? styles.checked : styles.unchecked}`}>
                          {visibleFilters[filterDef.key] && <Check size={14} color="white" />}
                        </div>
                        <span className={`${styles.dropdownItemLabel} ${visibleFilters[filterDef.key] ? styles.checkedLabel : styles.unchecked}`}>
                          {filterDef.label}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div ref={columnDropdownRef} className={styles.dropdownButtonWrapper}>
            <button
              className={`btn btn-outline ${styles.dropdownBtn}`}
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              title="Column settings"
            >
              <Settings size={18} />
            </button>

            {showColumnDropdown && (
              <div className={`card glass ${styles.dropdownContainer}`}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownSearchWrapper}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search columns..."
                      className={`input-field ${styles.dropdownSearchInput}`}
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.dropdownSectionTitle}>COLUMNS</div>

                <div className={styles.dropdownList}>
                  {availableColumns
                    .filter(col => col.label.toLowerCase().includes(columnSearch.toLowerCase()))
                    .map(col => (
                      <div
                        key={col.key}
                        className={styles.dropdownItemRow}
                        onClick={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                      >
                        <div className={`${styles.checkboxBox} ${visibleColumns[col.key] ? styles.checked : styles.unchecked}`}>
                          {visibleColumns[col.key] && <Check size={14} color="white" />}
                        </div>
                        <span className={`${styles.dropdownItemLabel} ${visibleColumns[col.key] ? styles.checkedLabel : styles.unchecked}`}>
                          {col.label}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleExport} className={`btn btn-outline ${styles.resetBtn}`} title="Export to Excel">
            <Download size={16} />
          </button>
          <button onClick={handleRefresh} className={`btn btn-outline ${styles.resetBtn}`} title="Refresh Data">
            <RotateCw size={16} />
          </button>
          <button onClick={handleReset} className={`btn btn-outline ${styles.resetBtn}`} title="Reset Filters">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {league?.id === 'APL' && (
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'player' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange('player')}
            title="View Players registration data"
          >
            <Users size={18} />
            Players
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'staff' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabChange('staff')}
            title="View Staff registration data"
          >
            <Users size={18} />
            Staff
          </button>
        </div>
      )}

      <div className={`card glass ${styles.tableWrapperCard}`}>
        <div className={styles.tableScrollContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={`loading-spinner ${styles.loadingSpinnerCentered}`}></div>
            </div>
          ) : players.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <table className={styles.tableDesktop}>
                <thead>
                  <tr>
                    {availableColumns.map(col => visibleColumns[col.key] && (
                      <th
                        key={col.key}
                        onClick={() => {
                          const isUrlCol = col.key.toLowerCase().includes('url') || col.label.toLowerCase().includes('url');
                          const isLinkCol = col.key.toLowerCase().includes('link') || col.label.toLowerCase().includes('link');
                          const isSortable = col.key !== '__index__' && !isUrlCol && !isLinkCol;
                          if (isSortable) handleSort(col.key);
                        }}
                        className={(() => {
                          const isUrlCol = col.key.toLowerCase().includes('url') || col.label.toLowerCase().includes('url');
                          const isLinkCol = col.key.toLowerCase().includes('link') || col.label.toLowerCase().includes('link');
                          return (col.key !== '__index__' && !isUrlCol && !isLinkCol) ? styles.pointerCursor : '';
                        })()}
                      >
                        <div className={styles.tableHeaderCellContent}>
                          {col.label} {(() => {
                            const isUrlCol = col.key.toLowerCase().includes('url') || col.label.toLowerCase().includes('url');
                            const isLinkCol = col.key.toLowerCase().includes('link') || col.label.toLowerCase().includes('link');
                            return (col.key !== '__index__' && !isUrlCol && !isLinkCol) && (
                              <ArrowUpDown size={14} />
                            );
                          })()}
                        </div>
                      </th>
                    ))}
                    {!isTeamView && !user?.isTeam && (customCheckoutParam !== "getEOIAdminPlayers") && (
                      <th className={styles.centeredCell} style={{ width: '120px' }}>
                        <div className={styles.tableHeaderCellContent}>Actions</div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, idx) => (
                    <tr key={player.id || player.PlayerId || idx} onClick={() => onViewDetails && onViewDetails(player)} className={styles.pointerCursor}>
                      {availableColumns.map(col => visibleColumns[col.key] && (
                        <td
                          key={col.key}
                          className={(col.key.toLowerCase().includes('url') || col.key.toLowerCase().includes('link')) ? styles.centeredCell : ''}
                        >
                          {(() => {
                            if (col.key === '__index__') {
                              return (filters.page - 1) * filters.pageSize + idx + 1;
                            }

                            const val = player[col.key];

                            if (col.key.toLowerCase() === 'eoi') {
                              const isInterested = Number(val) === 1 || val === '1' || val === true;
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                  {isInterested ? (
                                    <>
                                      <span
                                        style={{
                                          padding: '4px 10px',
                                          borderRadius: '9999px',
                                          background: 'rgba(34, 197, 94, 0.15)',
                                          color: '#4ade80',
                                          border: '1px solid rgba(34, 197, 94, 0.3)',
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Check size={13} /> Interested
                                      </span>
                                      <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                                        onClick={(e) => { e.stopPropagation(); handleToggleEOI(player, 0); }}
                                        title="Remove from EOI list"
                                      >
                                        Remove
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      style={{
                                        padding: '6px 14px',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #f306a7 0%, #fbbf24 100%)',
                                        border: 'none',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(243, 6, 167, 0.3)',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onClick={(e) => { e.stopPropagation(); handleToggleEOI(player, 1); }}
                                    >
                                      Mark as Interested
                                    </button>
                                  )}
                                </div>
                              );
                            }

                            const isPassportCol = col.key.toLowerCase().includes('passport');
                            const isLogoUrlCol = col.key.toLowerCase().includes('team_logourls') || col.key.toLowerCase().includes('logourl');
                            const isUrlCol = (col.key.toLowerCase().includes('url') || isPassportCol) && !isLogoUrlCol;
                            const isLinkCol = col.key.toLowerCase().includes('link') && !isPassportCol;

                            if (isLogoUrlCol && val) {
                              const urls = String(val).split(',').map(s => s.trim()).filter(Boolean);
                              if (urls.length > 0) {
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {urls.map((url, i) => (
                                      <img
                                        key={i}
                                        src={url}
                                        alt={`Team ${i + 1}`}
                                        style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '50%',
                                          objectFit: 'contain',
                                          border: '2px solid rgba(255, 255, 255, 0.2)',
                                          backgroundColor: 'rgba(0,0,0,0.4)',
                                          marginLeft: i > 0 ? '-8px' : '0px',
                                          zIndex: urls.length - i,
                                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                                        }}
                                        title={`Team Logo ${i + 1}`}
                                      />
                                    ))}
                                  </div>
                                );
                              }
                            }

                            if (isUrlCol && val) {
                              return (
                                <button
                                  className={`btn btn-primary`}
                                  style={{ padding: '4px 8px', borderRadius: '6px' }}
                                  onClick={(e) => { e.stopPropagation(); handleViewFile(val); }}
                                  title="View Image or Document"
                                >
                                  <Eye size={14} />
                                </button>
                              );
                            }

                            if (isLinkCol && val) {
                              const foundLink = extractLink(val);
                              if (foundLink) {
                                const displayText = val.replace(foundLink, '').trim();
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {/* {displayText && <span>{formatValue(displayText, col.key)}</span>} */}
                                    <a
                                      href={foundLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-primary"
                                      style={{ padding: '4px 12px', borderRadius: '6px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontSize: '12px' }}
                                      onClick={(e) => e.stopPropagation()}
                                      title={`Open link: ${foundLink}`}
                                    >
                                      View
                                    </a>
                                  </div>
                                );
                              }
                            }

                            return formatValue(val, col.key);
                          })()}
                        </td>
                      ))}
                      {!isTeamView && !user?.isTeam && (customCheckoutParam !== "getEOIAdminPlayers") && (
                        <td className={styles.centeredCell} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleEditClick(player)}
                              title="Edit Player"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', border: 'none', color: 'white' }}
                              onClick={() => handleDeleteClick(player)}
                              title="Delete Player"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.mobileCardsContainer}>
                {players.map((player, idx) => (
                  <div key={player.id || player.PlayerId || idx} className={`${styles.mobileCardWrapper} card glass mb-4`}>
                    <div className="flex items-center gap-4" style={{ marginBottom: '0.5rem' }}>
                      <div className={styles.mobileIndexBadge}>
                        #{(filters.page - 1) * filters.pageSize + idx + 1}
                      </div>
                      <div className={styles.flex1}>
                        <div className={styles.mobileCardFullname}>{player.FirstName || player.fullName || player.name}</div>
                      </div>
                    </div>

                    <div className={styles.mobileCardGrid}>
                      {availableColumns.map(col => visibleColumns[col.key] && col.key !== '__index__' && (
                        <div key={col.key}>
                          <div className={styles.mobileCardLabel}>{col.label}</div>
                          <div className={styles.mobileCardValue}>
                            {(() => {
                              const val = player[col.key];

                              if (col.key.toLowerCase() === 'eoi') {
                                const isInterested = Number(val) === 1 || val === '1' || val === true;
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {isInterested ? (
                                      <>
                                        <span
                                          style={{
                                            padding: '4px 10px',
                                            borderRadius: '9999px',
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            color: '#4ade80',
                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                          }}
                                        >
                                          <Check size={13} /> Interested
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-secondary"
                                          style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '6px', cursor: 'pointer' }}
                                          onClick={(e) => { e.stopPropagation(); handleToggleEOI(player, 0); }}
                                        >
                                          Remove
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        style={{
                                          padding: '6px 14px',
                                          fontSize: '0.78rem',
                                          fontWeight: 700,
                                          borderRadius: '8px',
                                          background: 'linear-gradient(135deg, #f306a7 0%, #fbbf24 100%)',
                                          border: 'none',
                                          color: '#fff',
                                          cursor: 'pointer'
                                        }}
                                        onClick={(e) => { e.stopPropagation(); handleToggleEOI(player, 1); }}
                                      >
                                        Mark as Interested
                                      </button>
                                    )}
                                  </div>
                                );
                              }

                              const isPassportCol = col.key.toLowerCase().includes('passport');
                              const isUrlCol = col.key.toLowerCase().includes('url') || isPassportCol;
                              const isLinkCol = col.key.toLowerCase().includes('link') && !isPassportCol;

                              if (isUrlCol && val) {
                                return (
                                  <button
                                    className={`${styles.mobileFileBtn}`}
                                    onClick={(e) => { e.stopPropagation(); handleViewFile(val); }}
                                    title="View Image or Document"
                                  >
                                    <Eye size={14} /> View File
                                  </button>
                                );
                              }

                              if (isLinkCol && val) {
                                const foundLink = extractLink(val);
                                if (foundLink) {
                                  const displayText = val.replace(foundLink, '').trim();
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      {displayText && <span>{formatValue(displayText, col.key)}</span>}
                                      <a
                                        href={foundLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.mobileFileBtn}
                                        onClick={(e) => e.stopPropagation()}
                                        title={`Open link: ${foundLink}`}
                                      >
                                        View Link
                                      </a>
                                    </div>
                                  );
                                }
                              }

                              return formatValue(val, col.key);
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                    {!isTeamView && !user?.isTeam && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(player);
                          }}
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#ef4444', border: 'none', color: 'white' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(player);
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && players.length > 0 && (
          <div className={`flex justify-between items-center ${styles.paginationFooter}`}>
            <div className={styles.paginationText}>
              Showing {players.length} of {total} results
            </div>
            <div className={styles.pageNumberGroup}>
              <button
                className={`${styles.pageItem} ${filters.page === 1 ? styles.disabled : ''}`}
                disabled={filters.page === 1}
                onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft size={16} />
              </button>

              {getPageNumbers().map(num => (
                <button
                  key={num}
                  className={`${styles.pageItem} ${filters.page === num ? styles.activePage : ''}`}
                  onClick={() => setFilters(p => ({ ...p, page: num }))}
                >
                  {num}
                </button>
              ))}

              <button
                className={`${styles.pageItem} ${filters.page >= totalPages ? styles.disabled : ''}`}
                disabled={filters.page >= totalPages}
                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showFileModal && (
        <div
          className={styles.fileModalOverlay}
          onClick={() => setShowFileModal(false)}
        >
          <div
            className={styles.fileModalContainer}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.fileModalHeader}>
              <h3 className={styles.fileModalTitle}>Document Viewer</h3>
              <button
                className={styles.fileModalCloseBtn}
                onClick={() => setShowFileModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className={styles.fileModalBody}>
              {!fileModalLoading && fileModalUrl && fileModalUrl.split('?')[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) && (
                <div className={styles.fileModalToolbar}>
                  <button
                    onClick={() => setZoom(z => Math.min(z + 0.5, 5))}
                    className={styles.fileModalControlBtn}
                    title="Zoom In"
                  >
                    <ZoomIn size={18} />
                  </button>
                  <button
                    onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))}
                    className={styles.fileModalControlBtn}
                    title="Zoom Out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <button
                    onClick={() => setRotation(r => r + 90)}
                    className={styles.fileModalControlBtn}
                    title="Rotate Clockwise"
                  >
                    <RotateCw size={18} />
                  </button>
                  <button
                    onClick={() => { setZoom(1); setRotation(0); }}
                    className={styles.fileModalControlBtn}
                    title="Reset View"
                  >
                    <Maximize size={18} />
                  </button>
                </div>
              )}

              {fileModalLoading ? (
                <div className={styles.fileModalLoaderWrapper}>
                  <Loader className="animate-spin" color="#6366f1" size={40} />
                  <p className={styles.fileModalLoaderText}>Decrypting Secure Document...</p>
                </div>
              ) : fileModalUrl ? (
                fileModalUrl.split('?')[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                  <div className={styles.fileModalImageWrapper}>
                    <img
                      src={fileModalUrl}
                      alt="Document"
                      className={styles.fileModalImage}
                      style={{
                        transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </div>
                ) : (
                  <iframe src={fileModalUrl} className={styles.fileModalIframe} title="Document Viewer" />
                )
              ) : (
                <p className={styles.fileModalError}>Failed to load document.</p>
              )}
            </div>

            {/* Footer */}
            {fileModalUrl && (
              <div className={styles.fileModalFooter}>
                <button
                  className={styles.mobileFileBtn}
                  onClick={handleDownload}
                  title="Download file to your device"
                >
                  <Download size={18} /> Download Original File
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT PLAYER MODAL */}
      {editPlayerModalOpen && editingPlayer && (
        <div className={regStyles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={regStyles.modalCard} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className={regStyles.modalHeader}>
              <h3 className={regStyles.modalTitle}>Edit Player Registration</h3>
              <button className={regStyles.modalClose} onClick={() => setEditPlayerModalOpen(false)}>×</button>
            </div>

            <div className={regStyles.modalBody} style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
              <div className={regStyles.formGrid}>

                {/* First Name */}
                <div className={regStyles.formGroup}>
                  <label className={regStyles.formLabel}>First Name<span className={regStyles.required}>*</span></label>
                  <input
                    type="text"
                    className={regStyles.textInput}
                    value={editingPlayer.FirstName}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, FirstName: e.target.value })}
                    required
                  />
                </div>

                {/* Last Name */}
                <div className={regStyles.formGroup}>
                  <label className={regStyles.formLabel}>Last Name (Surname)<span className={regStyles.required}>*</span></label>
                  <input
                    type="text"
                    className={regStyles.textInput}
                    value={editingPlayer.Surname}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, Surname: e.target.value })}
                    required
                  />
                </div>

                {/* Country Code & Mobile */}
                <div className={regStyles.formGroup}>
                  <label className={regStyles.formLabel}>Country Code<span className={regStyles.required}>*</span></label>
                  <select
                    className={regStyles.selectInput}
                    value={editingPlayer.CountryCode}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, CountryCode: e.target.value })}
                  >
                    <option value="">Select Code</option>
                    {COUNTRY_LIST.map(c => (
                      <option key={c.name} value={c.code}>
                        {c.name} (+{c.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={regStyles.formGroup}>
                  <label className={regStyles.formLabel}>Mobile Number<span className={regStyles.required}>*</span></label>
                  <input
                    type="text"
                    className={regStyles.textInput}
                    value={editingPlayer.Mobile}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, Mobile: e.target.value })}
                    required
                  />
                </div>

                {/* DOB & Email */}
                <div className={regStyles.formGroup}>
                  <label className={regStyles.formLabel}>Date of Birth<span className={regStyles.required}>*</span></label>
                  <input
                    type="date"
                    className={regStyles.textInput}
                    value={editingPlayer.DOB}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, DOB: e.target.value })}
                    required
                  />
                </div>

                <div className={regStyles.formGroup}>
                  <label className={regStyles.formLabel}>Email Address<span className={regStyles.required}>*</span></label>
                  <input
                    type="email"
                    className={regStyles.textInput}
                    value={editingPlayer.Email}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, Email: e.target.value })}
                    required
                  />
                </div>

                {/* Player Category (Classification) */}
                <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                  <label className={regStyles.formLabel}>Player Category<span className={regStyles.required}>*</span></label>
                  <div className={regStyles.radioGroup}>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editClassification"
                        className={regStyles.radioInput}
                        checked={editingPlayer.SelectedMember === 'Afghanistan'}
                        onChange={() => handleEditClassificationChange('Afghanistan')}
                      />
                      AFGHANISTAN
                    </label>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editClassification"
                        className={regStyles.radioInput}
                        checked={editingPlayer.SelectedMember === 'Ireland'}
                        onChange={() => handleEditClassificationChange('Ireland')}
                      />
                      IRELAND
                    </label>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editClassification"
                        className={regStyles.radioInput}
                        checked={editingPlayer.SelectedMember === 'ICC Full Member'}
                        onChange={() => handleEditClassificationChange('ICC Full Member')}
                      />
                      ICC FULL MEMBER
                    </label>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editClassification"
                        className={regStyles.radioInput}
                        checked={editingPlayer.SelectedMember === 'ICC Associate Member'}
                        onChange={() => handleEditClassificationChange('ICC Associate Member')}
                      />
                      ICC ASSOCIATE MEMBER
                    </label>
                  </div>
                </div>

                {/* Country dropdown for Full/Associate members */}
                {editingPlayer.SelectedMember && (editingPlayer.SelectedMember === 'ICC Full Member' || editingPlayer.SelectedMember === 'ICC Associate Member') && (
                  <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                    <label className={regStyles.formLabel}>Member Nation Country<span className={regStyles.required}>*</span></label>
                    <select
                      className={regStyles.selectInput}
                      value={editingPlayer.SelectedNation}
                      onChange={(e) => handleEditNationChange(e.target.value)}
                      required
                    >
                      <option value="" disabled>Select Country</option>
                      {editingPlayer.SelectedMember === 'ICC Full Member' && FULL_MEMBERS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {editingPlayer.SelectedMember === 'ICC Associate Member' && ASSOCIATE_MEMBERS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Player Profile Link Selection */}
                <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                  <label className={regStyles.formLabel}>Player Profile Link Type<span className={regStyles.required}>*</span></label>
                  <div className={regStyles.radioGroup}>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editProfileLinkType"
                        className={regStyles.radioInput}
                        checked={editingPlayer.isCricInfolink === 1}
                        onChange={() => setEditingPlayer({ ...editingPlayer, isCricInfolink: 1 })}
                      />
                      CricInfo
                    </label>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editProfileLinkType"
                        className={regStyles.radioInput}
                        checked={editingPlayer.isCricInfolink === 0}
                        onChange={() => setEditingPlayer({ ...editingPlayer, isCricInfolink: 0 })}
                      />
                      CricClubs
                    </label>
                  </div>
                </div>

                {/* Profile Link Input & Verify */}
                <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                  <label className={regStyles.formLabel}>
                    {editingPlayer.isCricInfolink === 1 ? 'CricInfo' : 'CricClubs'} Profile URL<span className={regStyles.required}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <input
                      type="text"
                      className={regStyles.textInput}
                      value={editingPlayer.CricinfoLink}
                      onChange={(e) => {
                        setEditingPlayer({
                          ...editingPlayer,
                          CricinfoLink: e.target.value
                        });
                        setEditIsVerified(false);
                        setEditVerifiedCategory(null);
                      }}
                      placeholder={`https://www.${editingPlayer.isCricInfolink === 1 ? 'espncricinfo.com' : 'cricclubs.com'}/...`}
                      style={{ flex: 1 }}
                    />
                    {(editingPlayer.SelectedNation === 'Afghanistan' || editingPlayer.SelectedNation === 'Ireland') && editingPlayer.isCricInfolink === 1 && (
                      <button
                        type="button"
                        className={regStyles.btnVerify}
                        onClick={verifyEditProfileUrl}
                        style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                  <label className={regStyles.formLabel}>Role<span className={regStyles.required}>*</span></label>
                  <select
                    className={regStyles.selectInput}
                    value={editingPlayer.PlayingRoles}
                    onChange={(e) => setEditingPlayer({
                      ...editingPlayer,
                      PlayingRoles: e.target.value,
                      BattingHandedness: 'Select',
                      PreferredBowlingStyle: 'Select'
                    })}
                  >
                    <option value="Select">Select Playing Role</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="Wicket Keeper">Wicket Keeper</option>
                    <option value="All Rounder">All Rounder</option>
                  </select>
                </div>

                {/* Batting Type */}
                {['Batsman', 'Wicket Keeper', 'Bowler', 'All Rounder'].includes(editingPlayer.PlayingRoles) && (
                  <div className={regStyles.formGroup}>
                    <label className={regStyles.formLabel}>Batting Type<span className={regStyles.required}>*</span></label>
                    <select
                      className={regStyles.selectInput}
                      value={editingPlayer.BattingHandedness}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, BattingHandedness: e.target.value })}
                    >
                      <option value="Select">Select Batting Type</option>
                      <option value="RHB">RHB (Right Hand Bat)</option>
                      <option value="LHB">LHB (Left Hand Bat)</option>
                    </select>
                  </div>
                )}

                {/* Bowling Type */}
                {['Bowler', 'All Rounder'].includes(editingPlayer.PlayingRoles) && (
                  <div className={regStyles.formGroup}>
                    <label className={regStyles.formLabel}>Bowling Type<span className={regStyles.required}>*</span></label>
                    <select
                      className={regStyles.selectInput}
                      value={editingPlayer.PreferredBowlingStyle}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, PreferredBowlingStyle: e.target.value })}
                    >
                      <option value="Select">Select Bowling Type</option>
                      <option value="RAP">RAP</option>
                      <option value="LAP">LAP</option>
                      <option value="RALB">RALB</option>
                      <option value="RAO">RAO</option>
                      <option value="SLAO">SLAO</option>
                      <option value="LAC">LAC</option>
                    </select>
                  </div>
                )}

                {/* Availability */}
                <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                  <label className={regStyles.formLabel}>Availability<span className={regStyles.required}>*</span></label>
                  <div className={regStyles.radioGroup}>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editAvailability"
                        className={regStyles.radioInput}
                        checked={editingPlayer.Availability === 'full'}
                        onChange={() => setEditingPlayer({ ...editingPlayer, Availability: 'full' })}
                      />
                      Full
                    </label>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editAvailability"
                        className={regStyles.radioInput}
                        checked={editingPlayer.Availability === 'partial'}
                        onChange={() => setEditingPlayer({ ...editingPlayer, Availability: 'partial' })}
                      />
                      Partial
                    </label>
                  </div>
                </div>

                {/* Partial Dates */}
                {editingPlayer.Availability === 'partial' && (
                  <>
                    <div className={regStyles.formGroup}>
                      <label className={regStyles.formLabel}>Available From Date<span className={regStyles.required}>*</span></label>
                      <input
                        type="date"
                        className={regStyles.textInput}
                        value={editingPlayer.FromDate}
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, FromDate: e.target.value })}
                      />
                    </div>
                    <div className={regStyles.formGroup}>
                      <label className={regStyles.formLabel}>Available To Date<span className={regStyles.required}>*</span></label>
                      <input
                        type="date"
                        className={regStyles.textInput}
                        value={editingPlayer.ToDate}
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, ToDate: e.target.value })}
                      />
                    </div>

                    {/* Per Match Fee */}
                    <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                      <label className={regStyles.formLabel}>Match fee per match in (USD)<span className={regStyles.required}>*</span></label>
                      <div className={regStyles.radioGroup}>
                        <label className={regStyles.radioOption}>
                          <input
                            type="radio"
                            name="editPerMatchFee"
                            className={regStyles.radioInput}
                            checked={editingPlayer.PerMatchFee === '1000'}
                            onChange={() => handleEditPerMatchFeeChange('1000')}
                          />
                          1,000
                        </label>
                        <label className={regStyles.radioOption}>
                          <input
                            type="radio"
                            name="editPerMatchFee"
                            className={regStyles.radioInput}
                            checked={editingPlayer.PerMatchFee === '4000'}
                            onChange={() => handleEditPerMatchFeeChange('4000')}
                            disabled={editVerifiedCategory === 'C' || editingPlayer.SelectedMember === 'UAE'}
                          />
                          4,000
                        </label>
                        <label className={regStyles.radioOption}>
                          <input
                            type="radio"
                            name="editPerMatchFee"
                            className={regStyles.radioInput}
                            checked={editingPlayer.PerMatchFee === '8000'}
                            onChange={() => handleEditPerMatchFeeChange('8000')}
                            disabled={editVerifiedCategory === 'C' || editVerifiedCategory === 'B' || editingPlayer.SelectedMember === 'UAE'}
                          />
                          8,000
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Reserve Price */}
                <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                  <label className={regStyles.formLabel}>Reserve Price in (USD)<span className={regStyles.required}>*</span></label>
                  <div className={regStyles.radioGroup}>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editReservePrice"
                        className={regStyles.radioInput}
                        checked={editingPlayer.ReservedPrice === '10000'}
                        onChange={() => handleEditReservePriceChange('10000')}
                      />
                      10,000
                    </label>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editReservePrice"
                        className={regStyles.radioInput}
                        checked={editingPlayer.ReservedPrice === '40000'}
                        onChange={() => handleEditReservePriceChange('40000')}
                        disabled={editVerifiedCategory === 'C' || editingPlayer.SelectedMember === 'UAE'}
                      />
                      40,000
                    </label>
                    <label className={regStyles.radioOption}>
                      <input
                        type="radio"
                        name="editReservePrice"
                        className={regStyles.radioInput}
                        checked={editingPlayer.ReservedPrice === '80000'}
                        onChange={() => handleEditReservePriceChange('80000')}
                        disabled={editVerifiedCategory === 'C' || editVerifiedCategory === 'B' || editingPlayer.SelectedMember === 'UAE'}
                      />
                      80,000
                    </label>
                  </div>
                </div>

                {/* Conditional Document Uploads (UAE shows Emirates ID, others show Passport) */}
                {editingPlayer.SelectedMember === 'UAE' ? (
                  <div className={regStyles.formGroup}>
                    <label className={regStyles.formLabel}>Emirates ID Document</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {(() => {
                        const previewUrl = editingPlayer.emiratesidFile
                          ? URL.createObjectURL(editingPlayer.emiratesidFile)
                          : editingPlayer.emiratesidurl;
                        return previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Emirates ID Preview"
                            style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.2)' }}>
                            <Upload size={20} color="rgba(255,255,255,0.4)" />
                          </div>
                        );
                      })()}
                      <label className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', fontSize: '13px' }}>
                        <Upload size={14} /> Upload New
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setEditingPlayer(prev => ({ ...prev, emiratesidFile: file }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className={regStyles.formGroup}>
                    <label className={regStyles.formLabel}>Passport Document</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {(() => {
                        const previewUrl = editingPlayer.passportFile
                          ? URL.createObjectURL(editingPlayer.passportFile)
                          : editingPlayer.passporturl;
                        return previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Passport Preview"
                            style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        ) : (
                          <div style={{ width: '60px', height: '60px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.2)' }}>
                            <Upload size={20} color="rgba(255,255,255,0.4)" />
                          </div>
                        );
                      })()}
                      <label className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', fontSize: '13px' }}>
                        <Upload size={14} /> Upload New
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setEditingPlayer(prev => ({ ...prev, passportFile: file }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* GCC Link (Non-editable, just show URL if exists) */}
                {editingPlayer.gccurl && (
                  <div className={`${regStyles.formGroup} ${regStyles.fullWidth}`}>
                    <label className={regStyles.formLabel}>GCC Link (Read-Only)</label>
                    <input
                      type="text"
                      className={regStyles.textInput}
                      value={editingPlayer.gccurl}
                      disabled
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                )}

              </div>
            </div>

            <div className={regStyles.modalFooter}>
              <button className="btn btn-outline" onClick={() => setEditPlayerModalOpen(false)} disabled={isEditingSaving}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditSave} disabled={isEditingSaving}>
                {isEditingSaving ? <Loader className={regStyles.spinner} /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className={regStyles.modalOverlay} style={{ zIndex: 1200 }}>
          <div className={regStyles.modalCard} style={{ maxWidth: '450px' }}>
            <div className={regStyles.modalHeader}>
              <h3 className={regStyles.modalTitle}>Confirm Player Deletion</h3>
              <button className={regStyles.modalClose} onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div className={regStyles.modalBody}>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem' }}>
                Are you sure you want to delete this player registry record? This action is permanent and cannot be undone.
              </p>
            </div>
            <div className={regStyles.modalFooter}>
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ backgroundColor: '#ef4444', border: 'none' }} onClick={confirmDeletePlayer}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CONFIRM MODAL */}
      {editConfirmModal.isOpen && (
        <div className={regStyles.modalOverlay} style={{ zIndex: 1300 }}>
          <div className={regStyles.modalCard} style={{ maxWidth: '400px' }}>
            <div className={regStyles.modalHeader}>
              <h3 className={regStyles.modalTitle}>Confirm Choice</h3>
              <button className={regStyles.modalClose} onClick={editConfirmModal.onCancel}>×</button>
            </div>
            <div className={regStyles.modalBody}>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem' }}>
                {editConfirmModal.message}
              </p>
            </div>
            <div className={regStyles.modalFooter}>
              <button className="btn btn-outline" onClick={editConfirmModal.onCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={editConfirmModal.onConfirm}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE ALERT MODAL */}
      {tableAlertModal.isOpen && (
        <div className={regStyles.modalOverlay} style={{ zIndex: 1400 }}>
          <div className={regStyles.modalCard} style={{ maxWidth: '400px' }}>
            <div className={regStyles.modalHeader}>
              <h3 className={regStyles.modalTitle}>Message</h3>
              <button className={regStyles.modalClose} onClick={() => setTableAlertModal({ isOpen: false, message: '' })}>×</button>
            </div>
            <div className={regStyles.modalBody}>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem' }}>
                {tableAlertModal.message}
              </p>
            </div>
            <div className={regStyles.modalFooter}>
              <button className="btn btn-primary" onClick={() => setTableAlertModal({ isOpen: false, message: '' })}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState = () => (
  <div className={styles.emptyStateContainer}>
    <div className={styles.emptyStateIcon}>
      <Users size={40} />
    </div>
    <h3 className={styles.emptyStateTitle}>No Records Found</h3>
    <p className={styles.emptyStateDesc}>
      We couldn't find any data matching your current search or filter criteria. Try adjusting your filters.
    </p>
  </div>
);

export default DataTable;
