const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const LEAGUES = {
  MPL: {
    id: 'MPL',
    name: 'Maharastra Premier League',
    primary: '#fd7702',
    secondary: '#fbbc04',
    logo: `${base}/assets/logos/mpl_logo.png`,
    background: `${base}/assets/bg/mpl_bg.png`,
    params: 'getmpldata',
    isEdit: false
  },
  APL: {
    id: 'APL',
    name: 'Andhra Premier League',
    primary: '#f58d6b',
    secondary: '#ffeb3b',
    logo: `${base}/assets/logos/apl_logo.png`,
    background: `${base}/assets/bg/apl_bg.png`,
    params: 'getaplplayer',
    staffParams: 'getaplstaff',
    isEdit: true
  },
  CPL: {
    id: 'CPL',
    name: 'Caribbean Premier League',
    primary: '#03A9F4',
    secondary: '#ffeb3b',
    logo: `${base}/assets/logos/cpl_logo.png`,
    background: `${base}/assets/bg/cpl_bg.png`,
    params: 'getcpldata',
    isEdit: false
  },
  ILT: {
    id: 'ILT',
    name: 'International League T20',
    primary: '#f306a7',
    secondary: '#fbbf24',
    logo: `${base}/assets/logos/ilt_logo.png`,
    background: `${base}/assets/bg/ilt_bg.png`,
    params: 'getILTdata',
    isEdit: false
  }

  // MPL_M: {
  //   id: 'MPL_M',
  //   name: 'Maharastra Premier League (Men)',
  //   primary: '#1a73e8',
  //   secondary: '#fbbc04',
  //   logo: '/assets/logos/mpl_m_logo.png',
  //   params: 'getmplmen',
  // },
  // MPL_W: {
  //   id: 'MPL_W',
  //   name: 'Maharastra Premier League (Women)',
  //   primary: '#1a73e8',
  //   secondary: '#fbbc04',
  //   logo: '/assets/logos/mpl_w_logo.png',
  //   params: 'getmplwomen'
  // },
  // WCPL: {
  //   id: 'WCPL',
  //   name: 'Womens Caribbean Premier League',
  //   primary: '#e91e63',
  //   secondary: '#ffeb3b',
  //   logo: '/assets/logos/wcpl_logo.png',
  //   params: 'getcplwomen'
  // },

};

export const applyLeagueTheme = (leagueId) => {
  const league = LEAGUES[leagueId] || LEAGUES.MPL;
  if (!league) return null;

  const root = document.documentElement;
  root.style.setProperty('--primary-color', league.primary);

  // Set Background Image (with fallback to default)
  const defaultBg = 'public/bg_img.png';
  const bgImage = league.background || defaultBg;
  root.style.setProperty('--bg-image', `url('${bgImage}')`);

  // Simple hex to rgb conversion for the shadow effect
  const r = parseInt(league.primary.slice(1, 3), 16);
  const g = parseInt(league.primary.slice(3, 5), 16);
  const b = parseInt(league.primary.slice(5, 7), 16);
  root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);

  return league;
};
