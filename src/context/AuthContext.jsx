import React, { createContext, useContext, useState, useEffect } from 'react';
import { LEAGUES, applyLeagueTheme } from '../configs/leagues';
import { playerService } from '../services/playerService';
import { AlertCircle } from 'lucide-react';

const API_URL = 'https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/';
const BASE_PAYLOAD = {
  FirstName: "", MiddleName: "", Surname: "", Mobile: "",
  DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
  PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
  PreferredBattingOrders: ""
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('player_registry_user');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
  });

  const [league, setLeague] = useState(() => {
    try {
      const saved = localStorage.getItem('player_registry_league');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing league from localStorage", e);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [loginData, setLoginData] = useState(() => {
    try {
      const saved = localStorage.getItem('player_registry_login_data');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing login data from localStorage", e);
      return null;
    }
  });

  // In-memory preferences store — loaded once per session, accessed instantly thereafter
  const [preferences, setPreferences] = useState({});

  /**
   * Load all preferences from server into memory.
   * Called once at login or on page boot. After this, all reads are instant.
   */
  const loadPreferences = async (username) => {
    if (!username) return {};
    const lsKey = `prefs_${username}`;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...BASE_PAYLOAD, Checkout: "get-preferences", UserName: username })
      });
      if (response.ok) {
        const json = await response.json();
        let parsedData = json;
        if (json.body && typeof json.body === 'string') {
          parsedData = JSON.parse(json.body);
        }
        // The API may return preferences as a JSON string — parse it if so
        let prefs = parsedData.preferences || parsedData.data || parsedData;
        if (prefs && typeof prefs === 'string') {
          try { prefs = JSON.parse(prefs); } catch (_) { }
        }
        if (prefs && typeof prefs === 'object' && !Array.isArray(prefs)) {
          if (Array.isArray(prefs.c) || Array.isArray(prefs.f)) {
            prefs = { [username]: prefs };
          }
          setPreferences(prefs);
          try { localStorage.setItem(lsKey, JSON.stringify(prefs)); } catch (_) { }
          return prefs;
        }
      }
    } catch (err) {
      console.error('Failed to load preferences from server, falling back to localStorage:', err);
    }

    // Fallback: load from localStorage if API failed or returned no data
    try {
      const cached = localStorage.getItem(lsKey);
      if (cached) {
        const prefs = JSON.parse(cached);
        console.info('Loaded preferences from localStorage fallback.');
        setPreferences(prefs);
        return prefs;
      }
    } catch (e) {
      console.error('localStorage fallback also failed:', e);
    }
    return {};
  };

  /**
   * Update a preference key instantly in memory, save to localStorage, then save to server in the background.
   * No blocking — UI updates immediately.
   */
  const updatePreference = (key, value) => {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    const username = key.split('_')[0];
    const lsKey = `prefs_${username}`;

    // Compute the full updated preferences map using current state via closure
    const updated = { ...preferences, [key]: valueStr };

    // Instant in-memory update — zero latency for DataTable
    setPreferences(updated);

    // Persist the full map to localStorage
    try { localStorage.setItem(lsKey, JSON.stringify(updated)); } catch (_) { }

    // Background save the FULL keyed map to server — fire-and-forget
    // Sending the complete map ensures future loads return the correct keyed structure
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...BASE_PAYLOAD,
        Checkout: "update-preferences",
        UserName: username,
        Preferences: JSON.stringify(updated)
      })
    }).catch(err => console.error('Background preference save failed:', err));
  };

  useEffect(() => {
    const checkInitialSession = async () => {
      if (user && user.token && user.token !== 'local-session') {
        await validateSession(user);
      }
      if (league) {
        applyLeagueTheme(league.id);
      }
      // Load preferences into memory on boot if user is already logged in
      if (user && user.username) {
        await loadPreferences(user.username);
      }
      setLoading(false);
    };

    checkInitialSession();
  }, [league]);

  const validateSession = async (currUser) => {
    if (!currUser || !currUser.token || currUser.token === 'local-session') return true;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...BASE_PAYLOAD,
          Checkout: "validate-session",
          UserName: currUser.username,
          SessionId: currUser.token
        })
      });

      if (response.ok) {
        const json = await response.json();
        let parsedData = json;
        if (json.body && typeof json.body === 'string') {
          parsedData = JSON.parse(json.body);
        }

        if (parsedData.success === true || parsedData.success === 'true') {
          return true;
        }
      }

      const msg = 'Session validation failed or expired. Please log in again.';
      setToast({ message: `Session validation failed or expired. Logging out in 5 seconds...`, type: 'error' });

      localStorage.setItem('player_registry_session_msg', msg);

      setTimeout(() => {
        setToast(null);
        logout();
      }, 5000);

      return false;
    } catch (err) {
      console.error("Session validation error:", err);
      return true;
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...BASE_PAYLOAD,
          Checkout: "login",
          username,
          password
        })
      });

      if (response.ok) {
        const json = await response.json();
        let parsedData = json;
        if (json.body && typeof json.body === 'string') {
          parsedData = JSON.parse(json.body);
        }

        if (parsedData.success === true || parsedData.success === 'true') {
          const leagueId = parsedData.league;
          const leagueData = LEAGUES[leagueId] || LEAGUES.MPL;

          const userData = {
            username,
            name: username,
            token: parsedData.sessionId || 'api-session'
          };

          setUser(userData);
          setLeague(leagueData);
          setLoginData(parsedData);

          localStorage.setItem('player_registry_user', JSON.stringify(userData));
          localStorage.setItem('player_registry_league', JSON.stringify(leagueData));
          localStorage.setItem('player_registry_login_data', JSON.stringify(parsedData));

          applyLeagueTheme(leagueData.id);

          // Load preferences into memory right after login — ready for the dashboard
          await loadPreferences(username);

          return userData;
        }
      }

      throw new Error('API Login failed');

    } catch (err) {
      throw new Error(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setLeague(null);
    setLoginData(null);
    setPreferences({}); // Clear in-memory preferences
    playerService.clearCache();
    localStorage.removeItem('player_registry_user');
    localStorage.removeItem('player_registry_league');
    localStorage.removeItem('player_registry_login_data');
  };

  return (
    <AuthContext.Provider value={{ user, league, login, logout, validateSession, loading, preferences, updatePreference, loginData }}>
      {children}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <AlertCircle className="toast-icon" size={20} />
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
