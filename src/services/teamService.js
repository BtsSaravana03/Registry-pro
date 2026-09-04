const API_URL = 'https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/';

const BASE_PAYLOAD = {
  FirstName: "", MiddleName: "", Surname: "", Mobile: "",
  DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
  PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
  PreferredBattingOrders: ""
};

export const ILT_STATIC_LOGOS = [
  {
    id: '3380',
    name: 'Desert Vipers',
    code: 'DV',
    url: 'https://www.ilt20.ae/static-assets/images/teams/home-logo/3380.png?v=31.62 '
  },
  {
    id: '3384',
    name: 'MI Emirates',
    code: 'MIE',
    url: 'https://www.ilt20.ae/static-assets/images/teams/home-logo/3384.png?v=31.62'
  },
  {
    id: '3382',
    name: 'Dubai Capitals',
    code: 'DC',
    url: 'https://www.ilt20.ae/static-assets/images/teams/home-logo/3382.png?v=31.62'
  },
  {
    id: '3381',
    name: 'Abu Dhabi Knight Riders',
    code: 'ADKR',
    url: 'https://www.ilt20.ae/static-assets/images/teams/home-logo/3381.png?v=31.62'
  },
  {
    id: '3383',
    name: 'Gulf Giants',
    code: 'GG',
    url: 'https://www.ilt20.ae/static-assets/images/teams/home-logo/3383.png?v=31.62'
  },
  {
    id: '3385',
    name: 'Sharjah Warriors',
    code: 'SW',
    url: 'https://www.ilt20.ae/static-assets/images/teams/home-logo/3385.png?v=31.62'
  }
];

export const teamService = {
  createTeam: async ({ teamName, teamUsername, teamPassword, createdBy, logoUrl }) => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "createTeam",
        Team_Name: (teamName || '').trim(),
        Team_Username: (teamUsername || '').trim(),
        Team_Password: (teamPassword || '').trim(),
        Created_by: createdBy,
        logoUrl: (logoUrl || '').trim()
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json || {};

      if (json && json.body) {
        if (typeof json.body === 'string') {
          try {
            parsedData = JSON.parse(json.body);
          } catch (e) {
            console.error("Error parsing response body:", e);
          }
        } else if (typeof json.body === 'object') {
          parsedData = json.body;
        }
      }

      // Check for success status codes (200, 201) or explicit success flags
      const statusCode = json?.statusCode || response.status;
      const isSuccess = response.ok && (
        statusCode === 200 ||
        statusCode === 201 ||
        parsedData?.success === true ||
        parsedData?.success === 'true' ||
        parsedData?.statusCode === 200 ||
        parsedData?.statusCode === 201
      );

      if (!isSuccess) {
        const errorMsg = parsedData?.message || json?.message || 'Failed to create team. Please try again.';
        throw new Error(errorMsg);
      }

      return parsedData;
    } catch (err) {
      console.error("Error creating team in teamService:", err);
      throw err;
    }
  },

  getAllTeams: async () => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "getallEOITeams"
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json || {};

      if (json && json.body) {
        if (typeof json.body === 'string') {
          try {
            parsedData = JSON.parse(json.body);
          } catch (e) {
            console.error("Error parsing response body:", e);
          }
        } else if (typeof json.body === 'object') {
          parsedData = json.body;
        }
      }

      const teams = parsedData.data || json.data || (Array.isArray(parsedData) ? parsedData : []);
      return Array.isArray(teams) ? teams : [];
    } catch (err) {
      console.error("Error fetching all teams in teamService:", err);
      throw err;
    }
  },

  updateTeam: async ({ teamId, teamName, teamUsername, teamPassword, logoUrl }) => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "updateTeam",
        Team_Id: teamId,
        Team_Name: (teamName || '').trim(),
        Team_Username: (teamUsername || '').trim(),
        Team_Password: (teamPassword || '').trim(),
        logoUrl: (logoUrl || '').trim()
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json || {};

      if (json && json.body) {
        if (typeof json.body === 'string') {
          try {
            parsedData = JSON.parse(json.body);
          } catch (e) {
            console.error("Error parsing response body:", e);
          }
        } else if (typeof json.body === 'object') {
          parsedData = json.body;
        }
      }

      const statusCode = json?.statusCode || response.status;
      const isSuccess = response.ok && (
        statusCode === 200 ||
        statusCode === 201 ||
        parsedData?.success === true ||
        parsedData?.success === 'true' ||
        parsedData?.statusCode === 200 ||
        parsedData?.statusCode === 201
      );

      if (!isSuccess) {
        const errorMsg = parsedData?.message || json?.message || 'Failed to update team. Please try again.';
        throw new Error(errorMsg);
      }

      return parsedData;
    } catch (err) {
      console.error("Error updating team in teamService:", err);
      throw err;
    }
  },

  loginTeam: async ({ teamUsername, teamPassword }) => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "loginTeam",
        Team_Username: (teamUsername || '').trim(),
        Team_Password: (teamPassword || '').trim()
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json || {};

      if (json && json.body) {
        if (typeof json.body === 'string') {
          try {
            parsedData = JSON.parse(json.body);
          } catch (e) {
            console.error("Error parsing response body:", e);
          }
        } else if (typeof json.body === 'object') {
          parsedData = json.body;
        }
      }

      const statusCode = json?.statusCode || response.status;
      const isSuccess = response.ok && (
        statusCode === 200 ||
        parsedData?.success === true ||
        parsedData?.success === 'true' ||
        parsedData?.statusCode === 200
      );

      if (!isSuccess) {
        const errorMsg = parsedData?.message || json?.message || 'Invalid team username or password.';
        throw new Error(errorMsg);
      }

      return parsedData;
    } catch (err) {
      console.error("Error during team login in teamService:", err);
      throw err;
    }
  },

  createPlayerEOI: async ({ playerId, teamId }) => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "createPlayerEOI",
        Player_Id: playerId,
        Team_Id: teamId
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        try {
          parsedData = JSON.parse(json.body);
        } catch (e) {
          console.error("Error parsing response body:", e);
        }
      } else if (typeof json.body === 'object') {
        parsedData = json.body;
      }

      return parsedData;
    } catch (err) {
      console.error("Error creating player EOI in teamService:", err);
      throw err;
    }
  },

  deletePlayerEOI: async ({ playerId, teamId }) => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "deletePlayerEOI",
        Player_Id: playerId,
        Team_Id: teamId
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json;
      if (json.body && typeof json.body === 'string') {
        try {
          parsedData = JSON.parse(json.body);
        } catch (e) {
          console.error("Error parsing response body:", e);
        }
      } else if (typeof json.body === 'object') {
        parsedData = json.body;
      }

      return parsedData;
    } catch (err) {
      console.error("Error deleting player EOI in teamService:", err);
      throw err;
    }
  },

  getEOIRestrictions: async () => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "getEOIRestrictions"
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json || {};

      if (json && json.body) {
        if (typeof json.body === 'string') {
          try {
            parsedData = JSON.parse(json.body);
          } catch (e) {
            console.error("Error parsing response body:", e);
          }
        } else if (typeof json.body === 'object') {
          parsedData = json.body;
        }
      }

      const rows = parsedData.data || json.data || (Array.isArray(parsedData) ? parsedData : []);
      if (Array.isArray(rows) && rows.length > 0) {
        return rows[0];
      }
      return null;
    } catch (err) {
      console.error("Error fetching EOI restrictions in teamService:", err);
      throw err;
    }
  },

  saveEOIRestrictions: async (restrictions) => {
    try {
      const payload = {
        ...BASE_PAYLOAD,
        Checkout: "saveEOIRestrictions",
        ...restrictions
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const json = await response.json();
      let parsedData = json || {};

      if (json && json.body) {
        if (typeof json.body === 'string') {
          try {
            parsedData = JSON.parse(json.body);
          } catch (e) {
            console.error("Error parsing response body:", e);
          }
        } else if (typeof json.body === 'object') {
          parsedData = json.body;
        }
      }

      const statusCode = json?.statusCode || response.status;
      const isSuccess = response.ok && (
        statusCode === 200 ||
        statusCode === 201 ||
        parsedData?.success === true ||
        parsedData?.success === 'true' ||
        parsedData?.statusCode === 200 ||
        parsedData?.statusCode === 201
      );

      if (!isSuccess) {
        const errorMsg = parsedData?.message || json?.message || 'Failed to save EOI restrictions.';
        throw new Error(errorMsg);
      }

      return parsedData;
    } catch (err) {
      console.error("Error saving EOI restrictions in teamService:", err);
      throw err;
    }
  }
};
