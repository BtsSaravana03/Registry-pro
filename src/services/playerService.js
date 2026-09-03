import * as XLSX from 'xlsx';

let CACHED_DATA = {};

export const playerService = {
  getPlayers: async (filters, checkoutParam = null) => {
    // Determine the data source key
    const savedLeague = localStorage.getItem('player_registry_league');
    const league = savedLeague ? JSON.parse(savedLeague) : null;
    const finalCheckout = checkoutParam || league?.params || "getTableData";

    const savedLogin = localStorage.getItem('player_registry_login_data');
    const loginData = savedLogin ? JSON.parse(savedLogin) : null;
    const agentId = loginData?.agentId;

    if (!CACHED_DATA[finalCheckout]) {
      try {
        const payload = {
          Checkout: finalCheckout,
          FirstName: "", MiddleName: "", Surname: "", Mobile: "",
          DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
          PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
          PreferredBattingOrders: ""
        };

        const savedUser = localStorage.getItem('player_registry_user');
        const userObj = savedUser ? JSON.parse(savedUser) : null;
        const teamId = userObj?.teamId || userObj?.Team_Id || loginData?.teamData?.Team_Id || loginData?.Team_Id;

        if (league?.id === 'ILT' && agentId !== undefined && agentId !== null && finalCheckout !== 'getEOIPlayers') {
          payload.AgentId = Number(agentId);
        }

        if (finalCheckout === 'getEOIPlayers' && teamId !== undefined && teamId !== null) {
          payload.Team_Id = Number(teamId);
          payload.teamId = Number(teamId);
        }

        const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const json = await response.json();
        let parsedData = json;
        if (json.body && typeof json.body === 'string') {
          parsedData = JSON.parse(json.body);
        }

        CACHED_DATA[finalCheckout] = parsedData.data || parsedData;
        if (!Array.isArray(CACHED_DATA[finalCheckout])) {
          CACHED_DATA[finalCheckout] = [];
        }
      } catch (err) {
        console.error(`Failed to fetch ${finalCheckout}:`, err);
        CACHED_DATA[finalCheckout] = [];
      }
    }

    let filtered = [...CACHED_DATA[finalCheckout]];
    const { search, sortBy, sortOrder, page = 1, pageSize = 10 } = filters || {};

    // Search globally across all values
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(p => {
        return Object.values(p).some(val => val && String(val).toLowerCase().includes(s));
      });
    }

    // Dynamic Filters
    const ignoredKeys = ['search', 'sortBy', 'sortOrder', 'page', 'pageSize', '__types'];
    const filterDefs = (filters && filters.__types) || [];

    Object.keys(filters || {}).forEach(key => {
      if (ignoredKeys.includes(key)) return;
      const val = filters[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const lowerVal = String(val).toLowerCase();
        const fType = (filterDefs.find(f => f.key === key) || {}).type || 'text';

        filtered = filtered.filter(p => {
          const rawVal = (p[key] !== undefined && p[key] !== null)
            ? p[key]
            : (key === 'Member_Type' ? (p['SelectedMember'] || p['Member_Type'] || p['Country']) : null);

          if (rawVal === undefined || rawVal === null) return false;
          const itemLower = String(rawVal).toLowerCase();

          if (fType === 'select') {
            if (itemLower.includes(',')) {
              const parts = itemLower.split(',').map(s => s.trim());
              return parts.includes(lowerVal);
            }
            return itemLower === lowerVal;
          } else {
            return itemLower.includes(lowerVal);
          }
        });
      }
    });

    // Sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const valA = a[sortBy] !== undefined ? a[sortBy] : '';
        const valB = b[sortBy] !== undefined ? b[sortBy] : '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
      data: paginated,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },

  getKeys: async (checkoutParam = null) => {
    const savedLeague = localStorage.getItem('player_registry_league');
    const league = savedLeague ? JSON.parse(savedLeague) : null;
    const finalCheckout = checkoutParam || league?.params || "getTableData";

    if (!CACHED_DATA[finalCheckout]) await playerService.getPlayers({}, finalCheckout);
    if (!CACHED_DATA[finalCheckout] || CACHED_DATA[finalCheckout].length === 0) return [];
    return Object.keys(CACHED_DATA[finalCheckout][0]);
  },

  getPlayerById: async (id, checkoutParam = null) => {
    const savedLeague = localStorage.getItem('player_registry_league');
    const league = savedLeague ? JSON.parse(savedLeague) : null;
    const finalCheckout = checkoutParam || league?.params || "getTableData";

    if (!CACHED_DATA[finalCheckout]) await playerService.getPlayers({}, finalCheckout);
    return CACHED_DATA[finalCheckout].find(p => String(p.id) === String(id) || String(p.PlayerId) === String(id));
  },

  exportToExcel: (data, columns, fileName = 'Players_List') => {
    let formattedData;
    
    if (columns && columns.length > 0) {
      formattedData = data.map((p, index) => {
        let row = {};
        columns.forEach(c => {
           if (c.key === '__index__') {
               row[c.label] = index + 1;
           } else {
               row[c.label] = p[c.key];
           }
        });
        return row;
      });
    } else {
      formattedData = data;
    }

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Players');
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${fileName}_${dateStr}.xlsx`);
  },

  getValidationStatus: async () => {
    try {
      const payload = {
        Checkout: "get-validation-status",
        FirstName: "", MiddleName: "", Surname: "", Mobile: "",
        DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
        PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
        PreferredBattingOrders: ""
      };

      const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        parsedData = JSON.parse(json.body);
      }

      return parsedData;
    } catch (err) {
      console.error("Failed to get validation status:", err);
      throw err;
    }
  },

  updateValidationStatus: async (validationVal) => {
    try {
      const payload = {
        Checkout: "update-validation-status",
        validation: validationVal,
        FirstName: "", MiddleName: "", Surname: "", Mobile: "",
        DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
        PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
        PreferredBattingOrders: ""
      };

      const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        parsedData = JSON.parse(json.body);
      }

      return parsedData;
    } catch (err) {
      console.error("Failed to update validation status:", err);
      throw err;
    }
  },

  getPlayerValidationConfig: async () => {
    try {
      const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Checkout: "playervalidationstatus"
        })
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        parsedData = JSON.parse(json.body);
      }

      return parsedData;
    } catch (err) {
      console.error("Failed to get player validation config:", err);
      throw err;
    }
  },

  registerPlayer: async (userDetails) => {
    try {
      const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userDetails)
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        parsedData = JSON.parse(json.body);
      }

      playerService.clearCache();
      return parsedData;
    } catch (err) {
      console.error("Failed to register player:", err);
      throw err;
    }
  },

  editPlayer: async (playerDetails) => {
    try {
      const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...playerDetails,
          Checkout: "editiltplayer"
        })
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        parsedData = JSON.parse(json.body);
      }

      playerService.clearCache();
      return parsedData;
    } catch (err) {
      console.error("Failed to edit player:", err);
      throw err;
    }
  },

  deletePlayer: async (referenceNo) => {
    try {
      const response = await fetch('https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Checkout: "deleteiltplayer",
          ReferenceNo: referenceNo,
          FirstName: "", MiddleName: "", Surname: "", Mobile: "",
          DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
          PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
          PreferredBattingOrders: ""
        })
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        parsedData = JSON.parse(json.body);
      }

      playerService.clearCache();
      return parsedData;
    } catch (err) {
      console.error("Failed to delete player:", err);
      throw err;
    }
  },

  updateCachedPlayer: (playerId, updates) => {
    Object.keys(CACHED_DATA).forEach(key => {
      if (Array.isArray(CACHED_DATA[key])) {
        CACHED_DATA[key] = CACHED_DATA[key].map(p => {
          const id = p.ID || p.Id || p.id;
          if (String(id) === String(playerId)) {
            return { ...p, ...updates };
          }
          return p;
        });
      }
    });
  },

  clearCache: () => {
    CACHED_DATA = {};
  }
};
