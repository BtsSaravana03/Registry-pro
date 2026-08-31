# Implementation Plan - User Theme Mapping

Transitions the application from a manual league selection dropdown to an automatic league assignment based on the logged-in user's credentials stored in a JSON configuration.

## User Review Required

> [!IMPORTANT]
> The league selection dropdown will be removed from the login page. Authentication will now automatically fetch the associated league for the given username.

## Proposed Changes

### Data & Configuration

#### [NEW] [users.json](file:///d:/Source/RegistryPro/src/data/users.json)
- Define a list of authorized users with their credentials and associated `leagueId`.
- Example users: `admin_mpl` (assigned to MPL), `admin_apl` (assigned to APL).

### Context & Logic

#### [MOD] [AuthContext.jsx](file:///d:/Source/RegistryPro/src/context/AuthContext.jsx)
- Import the new `users.json`.
- Update the `login` function to search for the user in the JSON list.
- Automatically set the `league` based on the user's `leagueId` found in the data.

### UI Changes

#### [MOD] [Login.jsx](file:///d:/Source/RegistryPro/src/pages/Login.jsx)
- Remove the League dropdown and its associated state.
- Simplify the login form to only require Username and Password.

## Open Questions

- Should I include additional mock users for other potential leagues, or stick to MPL and APL for now?

## Verification Plan

### Manual Verification
- Attempt login with `admin_mpl` and verify the theme is Blue (MPL).
- Attempt login with `admin_apl` and verify the theme is Magenta (APL).
- Verify that incorrect credentials still show the appropriate error message.
