import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DataTable from '../components/players/DataTable';
import { playerService } from '../services/playerService';
import { teamService } from '../services/teamService';
import { useAuth } from '../context/AuthContext';
import afgLogo from '../assets/ILT/afg-logo.png';
import iccLogo from '../assets/ILT/icc.png';
import ireLogo from '../assets/ILT/ire.jpg';
import iltGround from '../assets/ILT/ilt-ground.png';
import { Users, Shield, Sparkles, CheckCircle2, Bell, ChevronLeft, ChevronRight, Star, Home } from 'lucide-react';
import styles from './EOITeamDashboard.module.css';

const EOITeamDashboardPage = () => {
  const { user, league, loginData } = useAuth();
  const isAgent99 = Number(loginData?.agentId) === 99;
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const mainTab = rawTab || 'dashboard'; // 'dashboard' or 'eoi'

  // Ensure default tab=dashboard is set in URL if tab param is missing
  useEffect(() => {
    if (!rawTab) {
      setSearchParams({ tab: 'dashboard' }, { replace: true });
    }
  }, [rawTab, setSearchParams]);

  const [activeMemberType, setActiveMemberType] = useState(''); // for EOI tab
  const [selectedDashboardCard, setSelectedDashboardCard] = useState(''); // '' means All Interested

  const [eoiPlayers, setEoiPlayers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [eoiRestrictions, setEoiRestrictions] = useState(null);

  // Carousel State for Admin View
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Fetch EOI restrictions on mount
  useEffect(() => {
    const fetchRestrictions = async () => {
      try {
        const data = await teamService.getEOIRestrictions();
        if (data) {
          setEoiRestrictions({
            Afghanistan: data.Afghanistan !== null && data.Afghanistan !== undefined ? Number(data.Afghanistan) : 0,
            Ireland: data.Ireland !== null && data.Ireland !== undefined ? Number(data.Ireland) : 0,
            ICC_Full_Member: data.ICC_Full_Member !== null && data.ICC_Full_Member !== undefined ? Number(data.ICC_Full_Member) : 0,
            ICC_Associate_Member: data.ICC_Associate_Member !== null && data.ICC_Associate_Member !== undefined ? Number(data.ICC_Associate_Member) : 0,
            total: data.total !== null && data.total !== undefined ? Number(data.total) : 0
          });
        }
      } catch (err) {
        console.error("Failed to load EOI restrictions:", err);
      }
    };
    fetchRestrictions();
  }, []);

  // Fetch interested player stats for dashboard & teams
  useEffect(() => {
    const fetchEOIStats = async () => {
      setLoadingStats(true);
      try {
        const checkoutParam = isAgent99 ? 'getEOIAdminPlayers' : 'getEOIPlayers';
        const res = await playerService.getPlayers({ pageSize: 10000 }, checkoutParam);
        const data = res.data || [];
        setEoiPlayers(data);

        if (isAgent99) {
          const teamsList = await teamService.getAllTeams();
          setAllTeams(teamsList);
        }

        const now = new Date();
        setLastUpdated(`${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`);
      } catch (err) {
        console.error("Failed to load EOI stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchEOIStats();
  }, [isAgent99]);

  // Carousel Auto-play timer (5 seconds per card swap if > 2 teams and playing)
  useEffect(() => {
    if (!isAgent99 || allTeams.length <= 2 || mainTab !== 'dashboard' || !isPlaying) return;

    const timer = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % allTeams.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isAgent99, allTeams.length, mainTab, isPlaying]);

  const handlePrevCard = () => {
    if (!allTeams.length) return;
    setCarouselIndex(prev => (prev - 1 + allTeams.length) % allTeams.length);
  };

  const handleNextCard = () => {
    if (!allTeams.length) return;
    setCarouselIndex(prev => (prev + 1) % allTeams.length);
  };

  // Real-time listener callback when EOI status is toggled in DataTable
  const handleEOIChange = (playerId, newStatus) => {
    setEoiPlayers(prev => {
      const exists = prev.some(p => String(p.ID || p.Id || p.id) === String(playerId));
      if (exists) {
        return prev.map(p => {
          if (String(p.ID || p.Id || p.id) === String(playerId)) {
            return { ...p, EOI: newStatus };
          }
          return p;
        });
      } else {
        return [...prev, { id: playerId, ID: playerId, EOI: newStatus }];
      }
    });
  };

  const memberTypes = [
    { key: '', label: 'All Players', logo: null, isAll: true },
    { key: 'Afghanistan', label: 'Afghanistan', logo: afgLogo },
    { key: 'ICC Associate Member', label: 'ICC Associate Member', logo: iccLogo },
    { key: 'ICC Full Member', label: 'ICC Full Member', logo: iccLogo },
    { key: 'Ireland', label: 'Ireland', logo: ireLogo }
  ];

  const dashboardMemberCards = [
    { key: 'Afghanistan', label: 'Afghanistan', logo: afgLogo, accentColor: '#22c55e' },
    { key: 'ICC Associate Member', label: 'ICC Associate Member', logo: iccLogo, accentColor: '#3b82f6' },
    { key: 'ICC Full Member', label: 'ICC Full Member', logo: iccLogo, accentColor: '#6366f1' },
    { key: 'Ireland', label: 'Ireland', logo: ireLogo, accentColor: '#22c55e' }
  ];

  // Helper to check if player matches EOI criteria
  const isPlayerInterested = (p) => {
    return Number(p.EOI) === 1 || p.EOI === '1' || p.EOI === true;
  };

  // Helper to check if player belongs to team ID
  const isPlayerInTeam = (p, teamId) => {
    if (!p) return false;
    const rawIds = p.Team_Ids !== undefined && p.Team_Ids !== null ? String(p.Team_Ids) : '';
    if (!rawIds) return false;
    const ids = rawIds.split(',').map(s => s.trim());
    return ids.includes(String(teamId));
  };

  // Calculate counts for EOI === 1 players
  const stats = useMemo(() => {
    const interestedList = eoiPlayers.filter(isPlayerInterested);

    // If a team card is selected (selectedDashboardCard is teamId in Admin view)
    let filteredList = interestedList;
    if (isAgent99 && selectedDashboardCard) {
      filteredList = interestedList.filter(p => isPlayerInTeam(p, selectedDashboardCard));
    }

    const counts = {
      total: interestedList.length,
      'Afghanistan': 0,
      'ICC Associate Member': 0,
      'ICC Full Member': 0,
      'Ireland': 0
    };

    filteredList.forEach(p => {
      const mem = String(p.Member_Type || p.SelectedMember || p.Country || p.SelectedNation || '').toLowerCase().trim();
      if (mem.includes('afghanistan')) {
        counts['Afghanistan']++;
      } else if (mem.includes('ireland')) {
        counts['Ireland']++;
      } else if (mem.includes('associate')) {
        counts['ICC Associate Member']++;
      } else if (mem.includes('full member') || mem.includes('full')) {
        counts['ICC Full Member']++;
      }
    });

    return counts;
  }, [eoiPlayers, selectedDashboardCard, isAgent99]);

  // Team counts for Admin view
  const teamCounts = useMemo(() => {
    if (!isAgent99 || !allTeams.length) return {};
    const interestedList = eoiPlayers.filter(isPlayerInterested);

    const map = {};
    allTeams.forEach(t => {
      const tid = String(t.Team_Id || t.id || t.ID);
      const count = interestedList.filter(p => isPlayerInTeam(p, tid)).length;
      map[tid] = count;
    });
    return map;
  }, [eoiPlayers, allTeams, isAgent99]);

  const teamName = user?.name || user?.teamName || league?.name || 'Desert Vipers';
  const teamLogo = user?.logoUrl || user?.logo || league?.logo;
  const iltLogoPath = '/assets/logos/ilt_logo.png';

  return (
    <div className={styles.container}>
      {mainTab === 'dashboard' ? (
        <div className={styles.dashboardSection}>
          {/* Header Bar */}
          <div className={styles.eoiHeaderRow}>
            <div className={styles.eoiTitleGroup}>
              <span className={styles.titleAccentBar}></span>
              <div>
                <h1 className={styles.eoiMainTitle}>EXPRESSION OF INTEREST</h1>
                <p className={styles.eoiSubtitle}>
                  {isAgent99 ? 'DP World ILT20 League Administration EOI Dashboard' : `The Players ${teamName} interested in`}
                </p>
              </div>
            </div>

            {isAgent99 && (
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(243, 6, 167, 0.4)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
                onClick={() => navigate('/ilt-dashboard')}
              >
                <Home size={16} color="#f306a7" />
                <span>Back to Home</span>
              </button>
            )}
          </div>

          {/* Top Big Card Split (80% Height Area): 30% Summary Card & 70% Cards Grid */}
          <div className={styles.bigCardRow}>
            {/* 30% Summary Card */}
            <div
              className={`${styles.teamSummaryCard} ${selectedDashboardCard === '' ? styles.cardSelected : ''}`}
              style={{ backgroundImage: `linear-gradient(rgb(110 1 183 / 53%) 0%, rgba(12, 8, 30, 0.95) 100%), url(${iltGround})` }}
              onClick={() => setSelectedDashboardCard('')}
            >
              <div className={styles.yourTeamPill}>
                <Star size={12} fill="#f306a7" color="#f306a7" /> {isAgent99 ? 'ILT LEAGUE' : 'YOUR TEAM'}
              </div>

              <div className={styles.teamBadgeWrapper}>
                {isAgent99 ? (
                  <img src={iltLogoPath} alt="DP World ILT20" className={styles.teamLogoImg} />
                ) : teamLogo ? (
                  <img src={teamLogo} alt={teamName} className={styles.teamLogoImg} />
                ) : (
                  <div className={styles.teamAvatarFallback}>
                    <Shield size={36} />
                  </div>
                )}
              </div>

              <h2 className={styles.teamNameTitle}>{isAgent99 ? 'DP World ILT20' : teamName}</h2>

              <div className={styles.totalInterestedBox}>
                <span className={styles.totalInterestedLabel}>
                  TOTAL INTERESTED PLAYERS FOR AUCTION
                </span>
                <div className={styles.illuminatedBadge}>
                  <span className={styles.illuminatedCount}>{stats.total}</span>
                </div>
              </div>

              <div className={styles.acrossTeamsBadge}>
                <Users size={14} /> Across all teams
              </div>
            </div>

            {/* 70% Cards Area */}
            {isAgent99 ? (
              allTeams.length > 2 ? (
                /* 3D Animated Coverflow Carousel for > 2 teams */
                <div className={styles.carouselWrapper}>
                  <div className={styles.carouselTrackContainer}>
                    {/* Left Navigation Arrow */}
                    <button
                      type="button"
                      className={`${styles.carouselNavBtn} ${styles.carouselNavPrev}`}
                      onClick={handlePrevCard}
                      aria-label="Previous Team"
                    >
                      <ChevronLeft size={24} />
                    </button>

                    {/* Cards Stack */}
                    {allTeams.map((t, idx) => {
                      const tid = String(t.Team_Id || t.id || t.ID);
                      const count = teamCounts[tid] || 0;
                      const isSelected = selectedDashboardCard === tid;
                      const totalTeams = allTeams.length;

                      // Determine 3D position relative to current active index
                      let diff = (idx - carouselIndex + totalTeams) % totalTeams;
                      if (diff > Math.floor(totalTeams / 2)) {
                        diff -= totalTeams;
                      }

                      let cardClass = styles.coverflowCardHidden;
                      if (diff === 0) {
                        cardClass = `${styles.coverflowCardCenter} ${isSelected ? styles.cardSelected : ''}`;
                      } else if (diff === -1 || (diff === totalTeams - 1 && totalTeams > 2)) {
                        cardClass = styles.coverflowCardLeft;
                      } else if (diff === 1 || (diff === -(totalTeams - 1) && totalTeams > 2)) {
                        cardClass = styles.coverflowCardRight;
                      }

                      return (
                        <div
                          key={tid}
                          className={`${styles.coverflowCard} ${cardClass}`}
                          onClick={() => {
                            if (diff !== 0) {
                              setCarouselIndex(idx);
                            } else {
                              setIsPlaying(prev => !prev);
                            }
                            setSelectedDashboardCard(isSelected ? '' : tid);
                          }}
                        >
                          <div className={styles.coverflowCardHeader}>
                            {t.logoUrl ? (
                              <img src={t.logoUrl} alt={t.Team_Name} className={styles.coverflowLogo} />
                            ) : (
                              <Shield size={48} color="#f306a7" />
                            )}
                            <h3 className={styles.coverflowTitle}>{t.Team_Name}</h3>
                          </div>

                          <div className={styles.cardDivider} style={{ width: '100%' }}></div>

                          <div className={styles.memberCardBottomRow} style={{ width: '100%' }}>
                            <div className={styles.countGroup}>
                              <span className={styles.memberCountSublabel}>INTERESTED PLAYERS FOR AUCTION</span>
                              <span className={styles.memberBigCount}>{count}</span>
                            </div>

                            <div className={styles.playersCountTag}>
                              <Users size={14} />
                              <span>{count === 1 ? 'player' : 'players'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Right Navigation Arrow */}
                    <button
                      type="button"
                      className={`${styles.carouselNavBtn} ${styles.carouselNavNext}`}
                      onClick={handleNextCard}
                      aria-label="Next Team"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  {/* Pagination Dots */}
                  <div className={styles.carouselDots}>
                    {allTeams.map((t, idx) => (
                      <div
                        key={t.Team_Id || idx}
                        className={`${styles.dot} ${idx === carouselIndex ? styles.dotActive : ''}`}
                        onClick={() => setCarouselIndex(idx)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                /* Static Grid if <= 2 teams */
                <div className={styles.memberGrid70} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {allTeams.map(t => {
                    const tid = String(t.Team_Id || t.id || t.ID);
                    const count = teamCounts[tid] || 0;
                    const isSelected = selectedDashboardCard === tid;

                    return (
                      <div
                        key={tid}
                        className={`${styles.coverflowCard} ${isSelected ? styles.cardSelected : ''}`}
                        style={{ borderLeft: `4px solid #f306a7` }}
                        onClick={() => setSelectedDashboardCard(isSelected ? '' : tid)}
                      >

                        <div className={styles.coverflowCardHeader}>
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt={t.Team_Name} className={styles.memberCardLogo} />
                          ) : (
                            <Shield size={20} color="#f306a7" />
                          )}
                          <span className={styles.memberCardLabel}>{t.Team_Name}</span>
                        </div>

                        <div className={styles.cardDivider} style={{ width: '100%' }}></div>

                        <div className={styles.memberCardBottomRow} style={{ width: '100%' }}>
                          <div className={styles.countGroup}>
                            <span className={styles.memberCountSublabel}>INTERESTED PLAYERS FOR AUCTION</span>
                            <span className={styles.memberBigCount}>{count}</span>
                          </div>

                          <div className={styles.playersCountTag}>
                            <Users size={14} />
                            <span>{count === 1 ? 'player' : 'players'}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Non-Admin Team View: Member Cards Grid */
              <div className={styles.memberGrid70} style={{ flexDirection: 'column' }}>
                {dashboardMemberCards.map(item => {
                  const count = stats[item.key] || 0;
                  const isSelected = selectedDashboardCard === item.key;
                  let limit = 0;
                  if (!isAgent99 && eoiRestrictions) {
                    if (item.key === 'Afghanistan') limit = eoiRestrictions.Afghanistan;
                    else if (item.key === 'Ireland') limit = eoiRestrictions.Ireland;
                    else if (item.key === 'ICC Associate Member') limit = eoiRestrictions.ICC_Associate_Member;
                    else if (item.key === 'ICC Full Member') limit = eoiRestrictions.ICC_Full_Member;
                  }
                  const displayCountStr = limit > 0 ? `${count} / ${limit}` : `${count}`;

                  return (
                    <div
                      key={item.key}
                      className={`${styles.memberCard} ${isSelected ? styles.cardSelected : ''}`}
                      style={{ borderLeft: `4px solid ${item.accentColor}`, flexDirection: 'column', alignItems: 'normal' }}
                      onClick={() => setSelectedDashboardCard(isSelected ? '' : item.key)}
                    >
                      <div className={styles.memberCardTopRow} style={{ justifyContent: 'space-between' }}>
                        <div className={styles.memberCardHeader}>
                          <img src={item.logo} alt={item.label} className={styles.memberCardLogo} style={{ width: '58px', height: '58px' }} />
                          <span className={styles.memberCardLabel} style={{ fontSize: '1.5rem' }}>{item.label}</span>
                        </div>
                      </div>

                      <div className={styles.cardDivider}></div>

                      <div className={styles.memberCardBottomRow} style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                        <div className={styles.countGroup}>
                          <span className={styles.memberCountSublabel}>INTERESTED PLAYERS</span>
                          <span className={styles.memberBigCount}>{displayCountStr}</span>
                        </div>

                        <div className={styles.playersCountTag}>
                          <Users size={14} />
                          <span>{count === 1 ? 'player' : 'players'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 20% Height Member Type Cards for Admin */}
          {isAgent99 ? (
            <div style={{ marginTop: '1.25rem', width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                {dashboardMemberCards.map(item => {
                  const count = stats[item.key] || 0;
                  const formattedCount = String(count).padStart(2, '0');
                  return (
                    <div
                      key={item.key}
                      className={styles.memberCard}
                      style={{ borderLeft: `4px solid ${item.accentColor}` }}
                    >
                      <div className={styles.memberCardHeader} style={{ flex: 1 }}>
                        <img src={item.logo} alt={item.label} className={styles.memberCardLogo} />
                        <span className={styles.memberCardLabel} style={{ fontSize: '0.95rem' }}>{item.label}</span>
                      </div>

                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span className={styles.memberBigCount} style={{ fontSize: '2rem' }}>{formattedCount}</span>
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em' }}>PLAYERS</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={styles.notificationReservedSection}>
              <div className={styles.notificationHeader}>
                <Bell size={20} className={styles.notificationIcon} />
                <span>Notifications & Updates</span>
              </div>
              <p className={styles.notificationPlaceholderText}>
                Updates will appear here.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* EOI Tab View */
        <div className={styles.eoiSection}>
          {isAgent99 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(243, 6, 167, 0.4)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                }}
                onClick={() => navigate('/ilt-dashboard')}
              >
                <Home size={16} color="#f306a7" />
                <span>Back to Home</span>
              </button>
            </div>
          )}

          {/* Member Type Navigation Bar */}
          <div className={styles.memberNavContainer}>
            <span className={styles.memberNavTitle}>Filter By Member:</span>
            {memberTypes.map((item) => {
              const isActive = activeMemberType === item.key;
              let countStr = '';

              if (!isAgent99 && eoiRestrictions) {
                if (item.isAll) {
                  const limit = eoiRestrictions.total ?? 0;
                  countStr = `${stats.total}/${limit}`;
                } else if (item.key === 'Afghanistan') {
                  const limit = eoiRestrictions.Afghanistan ?? 0;
                  countStr = `${stats['Afghanistan']}/${limit}`;
                } else if (item.key === 'ICC Associate Member') {
                  const limit = eoiRestrictions.ICC_Associate_Member ?? 0;
                  countStr = `${stats['ICC Associate Member']}/${limit}`;
                } else if (item.key === 'ICC Full Member') {
                  const limit = eoiRestrictions.ICC_Full_Member ?? 0;
                  countStr = `${stats['ICC Full Member']}/${limit}`;
                } else if (item.key === 'Ireland') {
                  const limit = eoiRestrictions.Ireland ?? 0;
                  countStr = `${stats['Ireland']}/${limit}`;
                }
              }

              return (
                <button
                  key={item.key || 'all'}
                  type="button"
                  className={`${styles.memberNavItem} ${isActive ? styles.memberNavItemActive : ''}`}
                  onClick={() => setActiveMemberType(item.key)}
                >
                  {item.logo ? (
                    <img src={item.logo} alt={item.label} className={styles.memberLogo} />
                  ) : (
                    <Users size={16} />
                  )}
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {item.label}
                    {countStr && (
                      <span
                        style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(243, 6, 167, 0.15)',
                          color: isActive ? '#ffffff' : '#f306a7',
                          border: '1px solid rgba(243, 6, 167, 0.3)',
                          fontSize: '0.78rem',
                          fontWeight: 800
                        }}
                      >
                        {countStr}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main Interactive EOI Player Registry Table */}
          <div>
            <DataTable
              customCheckoutParam={isAgent99 ? "getEOIAdminPlayers" : "getEOIPlayers"}
              isTeamView={!isAgent99}
              onEOIChange={handleEOIChange}
              externalFilters={activeMemberType ? { Member_Type: activeMemberType } : {}}
              eoiRestrictions={eoiRestrictions}
              eoiPlayers={eoiPlayers}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EOITeamDashboardPage;
