/**
 * Preference Service - AWS Lambda API utility
 * All preference state is managed by AuthContext (in-memory).
 * This service only handles direct API communication when needed standalone.
 */

const API_URL = 'https://auqvn8x7x4.execute-api.ap-south-1.amazonaws.com/ECLPlayerRegistration/player/';
const BASE_PAYLOAD = {
  FirstName: "", MiddleName: "", Surname: "", Mobile: "",
  DOB: "", Email: "", State: "", TrialCity: "", TrialZone: "",
  PlayingRoles: "", BattingHandedness: "", PreferredBowlingStyle: "",
  PreferredBattingOrders: ""
};

export const preferenceService = {
  /**
   * Fetch all preferences for a user from the server.
   * Returns a parsed object keyed by username_tab.
   */
  async getAllPreferences(username) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...BASE_PAYLOAD, Checkout: "get-preferences", username })
      });

      if (response.ok) {
        const json = await response.json();
        let parsedData = json;
        if (json.body && typeof json.body === 'string') {
          parsedData = JSON.parse(json.body);
        }
        const prefs = parsedData.preferences || parsedData.data || parsedData;
        if (prefs && typeof prefs === 'object' && !Array.isArray(prefs)) {
          return prefs;
        }
      }
    } catch (err) {
      console.error('Failed to load preferences from server:', err);
    }
    return {};
  },

  /**
   * Fire-and-forget save to the server. Does not block the caller.
   */
  saveUserPreferences(username, tab, preferences) {
    const key = `${username}_${tab}`;
    const valueStr = typeof preferences === 'string' ? preferences : JSON.stringify(preferences);

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...BASE_PAYLOAD,
        Checkout: "update-preferences",
        username: key,
        preferences: valueStr
      })
    }).catch(err => console.error('Failed to save preferences:', err));
  }
};
