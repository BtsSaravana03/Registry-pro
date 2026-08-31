import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { playerService } from '../services/playerService';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader,
  ArrowLeft,
  Check,
  X,
  Info
} from 'lucide-react';
import styles from './ExcelUpload.module.css';

// Import the Excel template
import excelTemplate from '../assets/ILT2026_Auction_Player_Registration_Template.xlsx';

function convertExcelDate(value) {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  } else if (typeof value === "number") {
    const days = Math.floor(value);
    const excelEpoch = Date.UTC(1899, 11, 30);
    const utcTime = excelEpoch + days * 86400000;
    return new Date(utcTime).toISOString().split("T")[0];
  } else {
    return "";
  }
}

function extractCountryCode(input) {
  if (!input) return "";
  const match = String(input).match(/code:([^,]+)/i);
  return match ? match[1].trim() : "";
}

function extractCricinfoPlayerId(url) {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    const parsed = new URL(trimmed);
    if (parsed.hostname !== 'www.cricinfo.com' && parsed.hostname !== 'cricinfo.com') {
      return null;
    }
    const match = parsed.pathname.match(/-(\d+)\/?$/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

const ExcelUploadPage = () => {
  const { league, loginData } = useAuth();
  const navigate = useNavigate();

  // Authentication check
  const isAuthorized = league?.id === 'ILT' && loginData?.agentId !== 100;
  const agentId = loginData?.agentId;

  // Page States
  const [players, setPlayers] = useState([]); // Array of { data, error, status, message }
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [uploadSummary, setUploadSummary] = useState(null); // { success: X, failed: Y }

  const fileInputRef = useRef(null);

  // Auto-redirect if not authorized
  useEffect(() => {
    if (!isAuthorized) {
      // Allow component to render restricted state
    }
  }, [isAuthorized]);

  // Validation function matching the original logic
  const validatePlayer = (userDetails) => {
    const emailFilter = /^([a-zA-Z0-9_.-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    const mobileFilter = /^\d{7,10}$/;

    if (!userDetails.Email) {
      return "Missing Email address.";
    }
    if (!emailFilter.test(userDetails.Email)) {
      return "Invalid Email address format.";
    }
    if (!userDetails.FirstName) {
      return "Missing First Name.";
    }
    if (!userDetails.Surname) {
      return "Missing Last Name.";
    }
    if (!userDetails.DOB) {
      return "Missing Date of Birth (DOB).";
    }

    let inputDate = new Date(userDetails.DOB);
    let minDate = new Date("2015-12-31");
    inputDate.setHours(0, 0, 0, 0);
    minDate.setHours(0, 0, 0, 0);
    if (isNaN(inputDate.getTime())) {
      return "Invalid DOB date format.";
    }
    if (inputDate > minDate) {
      return "Date of Birth cannot be after 2015.";
    }

    if (!userDetails.Mobile) {
      return "Missing Mobile Number.";
    }
    if (!mobileFilter.test(userDetails.Mobile)) {
      return "Mobile Number must be between 7 and 10 digits.";
    }
    if (userDetails.PlayingRoles === "") {
      return "Missing Playing Roles.";
    }
    if (userDetails.Availability === "") {
      return "Missing Availability (full/partial).";
    }
    if (userDetails.SelectedNation === "") {
      return "Missing Country.";
    }
    if (userDetails.SelectedMember === "") {
      return "Missing MemberType.";
    }

    // Cricinfo link / Criclub link checks
    if (!userDetails.CricinfoLink && !userDetails.CriclubLink) {
      return "Missing Player Profile Link.";
    }

    // Availability validation checks
    if (userDetails.Availability.toLowerCase() === "partial") {
      if (userDetails.FromDate.length === 0) {
        return "Missing From Date (required for partial availability).";
      }
      if (userDetails.toDate.length === 0) {
        return "Missing To Date (required for partial availability).";
      }
      if (userDetails.PerMatchFee.length === 0) {
        return "Missing Match fee in USD (required for partial availability).";
      }
    }

    if (userDetails.CountryCode.length === 0) {
      return "Missing Country Code.";
    }

    if (userDetails.ReservedPrice.length === 0) {
      return "Missing Reserve Price.";
    } else {
      if (parseInt(userDetails.ReservedPrice) > 100000) {
        return "Reserve Price can't exceed $100,000 USD.";
      }
    }

    if (userDetails.Availability.toLowerCase() === "full") {
      if (userDetails.FromDate.length !== 0 || userDetails.toDate.length !== 0) {
        return "From/To Dates are not allowed for full availability.";
      }
    }

    if (["Batsman", "Wicket Keeper", "All Rounder", "Bowler"].includes(userDetails.PlayingRoles)) {
      if (userDetails.BattingHandedness === "") {
        return "Missing Batting Type (required for playing role).";
      }
    }

    if (["Bowler", "All Rounder"].includes(userDetails.PlayingRoles)) {
      if (userDetails.PreferredBowlingStyle === "") {
        return "Missing Bowling Type (required for bowlers/all rounders).";
      }
    }

    return null; // Valid
  };

  // Mapper function to format row details
  const cleanAndMapRow = (row, agentId, validationConfigVal) => {
    const rawFirstName = String(row.FirstName || "").trim();
    const rawLastName = String(row.LastName || row.Surname || "").trim();
    const rawEmail = String(row.Email || "").trim();
    const rawAvailability = String(row.Availability || "").trim().toLowerCase();

    let selectedNation = String(row.Country || "");
    let selectedMember = String(row.MemberType || "").trim();

    if (selectedMember.toUpperCase() === "UAE") {
      selectedMember = "UAE";
      selectedNation = "United Arab Emirates";
    } else if (selectedMember !== "") {
      const smLower = selectedMember.toLowerCase();
      if (smLower === "afghanistan" || smLower === "afghanisthan" || smLower.includes("afghan")) {
        selectedMember = "Afghanistan";
        selectedNation = "Afghanistan";
      } else if (smLower === "ireland" || smLower.includes("ireland")) {
        selectedMember = "Ireland";
        selectedNation = "Ireland";
      } else if (smLower.includes("other") || smLower.includes("other_full") || smLower.includes("other-full")) {
        selectedMember = "ICC Other Full Member";
      } else if (smLower.includes("full")) {
        selectedMember = "ICC Full Member";
      } else if (smLower.includes("associate")) {
        selectedMember = "ICC Associate Member";
      }
    }

    const countryLower = selectedNation.toLowerCase();
    if (countryLower === "afghanistan" || countryLower === "afghanisthan") {
      selectedMember = "Afghanistan";
      selectedNation = "Afghanistan";
    } else if (countryLower === "ireland") {
      selectedMember = "Ireland";
      selectedNation = "Ireland";
    }

    const cricinfoLink = String(row.CricInfo_PlayerProfile || row.CricinfoLink || "");
    const criclubLink = String(row.CricClubs_PlayerProfile || row.CriclubLink || "");

    let isCricInfolink = "0";
    let finalProfileLink = cricinfoLink;
    if (cricinfoLink.length !== 0) {
      isCricInfolink = "1";
    } else {
      isCricInfolink = "0";
      finalProfileLink = criclubLink;
    }

    const userDetails = {
      FirstName: rawFirstName,
      MiddleName: String(row.MiddleName || ""),
      Surname: rawLastName,
      Mobile: String(row.Mobile || ""),
      DOB: convertExcelDate(row.DOB),
      Email: rawEmail,
      State: String(row.State || ""),
      TrialCity: String(row.TrialCity || ""),
      TrialZone: String(row.TrialZone || ""),
      PlayingRoles: String(row.PlayingRole || row.PlayingRoles || ""),
      BattingHandedness: String(row.BattingType || row.BattingHandedness || ""),
      PreferredBowlingStyle: String(row.BowlingType || row.PreferredBowlingStyle || ""),
      PreferredBattingOrders: String(row.PreferredBattingOrders || ""),
      Password: String(row.Password || ""),
      ConfirmPassword: String(row.ConfirmPassword || ""),
      AgentId: String(agentId || ""),
      ReferenceNo: "",
      Reregister: String(row.Reregister || "Initial"),
      ReservedPrice: String(row.ReservePriceinUSD || row.ReservedPrice || ""),
      SelectedNation: selectedNation,
      CricinfoLink: finalProfileLink,
      CriclubLink: criclubLink,
      gccurl: "",
      passporturl: "",
      Availability: rawAvailability,
      FromDate: row.FromDate ? convertExcelDate(row.FromDate) : "",
      toDate: row.toDate ? convertExcelDate(row.toDate) : "",
      isPlayerValidation: String(validationConfigVal),
      Reason: String(row.Reason || ""),
      SelectedMember: selectedMember,
      Checkout: "RegILT",
      PlayerValidated: "0",
      isPassport: "1",
      isCricInfolink: isCricInfolink,
      IsEligibleUAEplayer: selectedMember === "UAE" ? "1" : "0",
      CountryCode: extractCountryCode(String(row.CountryCode || "")),
      PerMatchFee: String(row.MatchFeeinUSD || row.PerMatchFee || ""),
      emiratesidurl: ""
    };

    if (userDetails.Availability.toLowerCase() === "full" && userDetails.ReservedPrice) {
      userDetails.PerMatchFee = String(Number(userDetails.ReservedPrice) / 10);
    }

    return userDetails;
  };

  // Parse Excel File
  const handleFile = async (file) => {
    if (!file) return;

    // Check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx') {
      alert("Please upload a valid Excel file (.xlsx)");
      return;
    }

    setLoading(true);
    setUploadSummary(null);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert("The Excel sheet is empty.");
          setLoading(false);
          return;
        }

        // Fetch validation config from the server
        let validationConfigVal = "0";
        try {
          const config = await playerService.getPlayerValidationConfig();
          validationConfigVal = config?.validation?.toString() || "0";
        } catch (err) {
          console.error("Failed to load validation config, using default", err);
        }

        // Clean keys, filter empty rows, and format data
        const mappedPlayers = [];
        for (const row of jsonData) {
          const cleanedRow = {};
          for (let key in row) {
            cleanedRow[key.trim()] = row[key];
          }

          // Verify if row contains any non-empty cell values
          const hasData = Object.values(cleanedRow).some(
            val => val !== undefined && val !== null && String(val).trim() !== ""
          );
          if (!hasData) continue;

          const userDetails = cleanAndMapRow(cleanedRow, agentId, validationConfigVal);

          let error = null;
          const isAfgOrIreRow = userDetails.SelectedMember === 'Afghanistan' || userDetails.SelectedMember === 'Ireland' || userDetails.SelectedNation === 'Afghanistan' || userDetails.SelectedNation === 'Ireland';

          if (isAfgOrIreRow && userDetails.isCricInfolink === "1") {
            const extractedId = extractCricinfoPlayerId(userDetails.CricinfoLink);
            if (!extractedId) {
              error = "Please enter a valid CricInfo profile link containing the player ID at the end to verify base price.";
            } else {
              try {
                const res = await fetch(`https://cloud.cricket-21.com/OtherSportsApi/cricket/category/${extractedId}`);
                const data = await res.json();
                if (data && data.success && (data.category === 'A' || data.category === 'B' || data.category === 'C')) {
                  const cat = data.category;
                  if (cat === 'A') {
                    userDetails.ReservedPrice = '80000';
                  } else if (cat === 'B') {
                    userDetails.ReservedPrice = '40000';
                  } else if (cat === 'C') {
                    userDetails.ReservedPrice = '10000';
                  }
                  // Map match fee to updated reserve price
                  userDetails.PerMatchFee = String(Number(userDetails.ReservedPrice) / 10);
                } else {
                  error = "Verification failed: Invalid CricInfo player profile or category not found.";
                }
              } catch (e) {
                error = "Error connecting to verification API: " + e.message;
              }
            }
          }

          if (!error) {
            error = validatePlayer(userDetails);
          }

          mappedPlayers.push({
            data: userDetails,
            error,
            status: error ? 'error' : 'idle',
            message: error || ''
          });
        }

        setPlayers(mappedPlayers);
      } catch (err) {
        console.error("Error reading file:", err);
        alert("An error occurred while parsing the Excel file. Make sure it matches the layout.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Reset page
  const handleReset = () => {
    setPlayers([]);
    setUploadSummary(null);
    setProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Bulk register action
  const handleRegisterPlayers = async () => {
    const validPlayers = players.filter(p => p.status === 'idle');
    if (validPlayers.length === 0) return;

    setUploading(true);
    setProgress({ current: 0, total: validPlayers.length });

    let successCount = 0;
    let failedCount = 0;

    // Fetch config to verify latest validation state
    let validationVal = "0";
    try {
      const config = await playerService.getPlayerValidationConfig();
      validationVal = config?.validation?.toString() || "0";
    } catch (err) {
      console.warn("Failed to fetch player validation config inside register:", err);
    }

    // Map list to keep track of row updates
    const updatedPlayers = [...players];

    for (let i = 0; i < updatedPlayers.length; i++) {
      const player = updatedPlayers[i];

      // Skip players that have validation errors
      if (player.status === 'error') continue;

      // Update row state to uploading
      player.status = 'uploading';
      player.data.isPlayerValidation = validationVal;
      setPlayers([...updatedPlayers]);

      try {
        const result = await playerService.registerPlayer(player.data);

        if (result.success) {
          player.status = 'success';
          player.message = `Successfully registered: ${result.referenceNo || 'Success'}`;
          successCount++;
        } else {
          player.status = 'failed';
          player.message = result.message || "Failed to register player.";
          failedCount++;
        }
      } catch (err) {
        console.error("API error for row:", i, err);
        player.status = 'failed';
        player.message = "API Connection Error.";
        failedCount++;
      }

      // Update progress bar
      setProgress(prev => ({ ...prev, current: prev.current + 1 }));
      setPlayers([...updatedPlayers]);
    }

    setUploading(false);
    setUploadSummary({ success: successCount, failed: failedCount });
    playerService.clearCache(); // Force refresh in main player listing
  };

  // Compute stats
  const totalCount = players.length;
  const errorCount = players.filter(p => p.status === 'error').length;
  const readyCount = players.filter(p => p.status === 'idle').length;

  // Render Access Restricted card if not authorized
  if (!isAuthorized) {
    return (
      <div className={styles.unauthorizedContainer}>
        <div className={`card glass ${styles.unauthorizedCard}`}>
          <div className={styles.unauthorizedIcon}>
            <AlertTriangle size={32} />
          </div>
          <h2 className={styles.unauthorizedTitle}>Access Restricted</h2>
          <p className={styles.unauthorizedDesc}>
            Only authorized agents are allowed to register players into the system registry.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <marquee style={{ backgroundColor: 'transparent', color: 'white', fontSize: '18px', fontWeight: 'bold', padding: '10px', maxWidth: "1200px" }}>
          Please download the Excel template, enter all the required player details, and use the completed template for the bulk upload <blink>📄</blink>.
        </marquee>
      </div>

      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>Excel Upload</h1>
              <p className={styles.subtitle}>Upload Excel spreadsheet to register players in bulk.</p>
            </div>
            <a
              href={excelTemplate}
              download="ILT2026_Auction_Player_Registration_Template.xlsx"
              className={styles.downloadBtn}
            >
              <Download size={18} />
              Download Template
            </a>
          </div>

          {/* Upload Zone (Show if no players loaded and not upload complete) */}
          {players.length === 0 && (
            <div className={styles.uploadSection}>
              <div
                className={`${styles.dragZone} ${isDragging ? styles.dragZoneActive : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInput}
                  accept=".xlsx"
                  onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                />
                <div className={styles.uploadIcon}>
                  {loading ? <Loader className={styles.spinner} style={{ width: 32, height: 32 }} /> : <Upload size={32} />}
                </div>
                <h3 className={styles.dragZoneTitle}>
                  {loading ? 'Reading spreadsheet data...' : 'Drag & Drop Excel File here'}
                </h3>
                <p className={styles.dragZoneText}>
                  {loading ? 'Validating row entries...' : 'or click to browse your files. Only .xlsx files supported.'}
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid and Preview (Show if players loaded) */}
          {players.length > 0 && (
            <div className="d-flex flex-column gap-4">
              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statsCard}>
                  <div className={`${styles.statsNumber} ${styles.statsTotal}`}>{totalCount}</div>
                  <div className={styles.statsLabel}>Total Rows Parsed</div>
                </div>
                <div className={styles.statsCard}>
                  <div className={`${styles.statsNumber} ${styles.statsReady}`}>{readyCount}</div>
                  <div className={styles.statsLabel}>Ready to Register</div>
                </div>
                <div className={styles.statsCard}>
                  <div className={`${styles.statsNumber} ${styles.statsErrors}`}>{errorCount}</div>
                  <div className={styles.statsLabel}>Validation Errors</div>
                </div>
              </div>

              {/* Validation warning block */}
              {errorCount > 0 && !uploadSummary && (
                <div className="alert alert-danger d-flex align-items-center gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
                  <AlertTriangle size={20} className="text-danger" />
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong>Spreadsheet validation warnings:</strong> {errorCount} player entries contain validation errors and will be skipped. You can hover over cell errors to view explanations.
                  </div>
                </div>
              )}

              {/* Progress Container during registration */}
              {uploading && (
                <div className={styles.progressCard}>
                  <div className={styles.progressLabelContainer}>
                    <span className={styles.progressLabel}>
                      Registering player {progress.current} of {progress.total}...
                    </span>
                    <span className={styles.progressPercent}>
                      {progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Summary Report */}
              {uploadSummary && (
                <div className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <CheckCircle2 size={24} />
                    <span>Bulk Upload Completed!</span>
                  </div>
                  <div className={styles.reportDetails}>
                    Successfully registered: <strong>{uploadSummary.success}</strong> players.
                    <br />
                    Failed to register: <strong>{uploadSummary.failed}</strong> players.
                    {errorCount > 0 && (
                      <>
                        <br />
                        Skipped (due to formatting errors): <strong>{errorCount}</strong> players.
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Table Card */}
              <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <h3 className={styles.tableTitle}>Players List Preview</h3>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Scroll horizontally to view all fields</span>
                </div>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>#</th>
                        <th className={styles.th}>Name</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Mobile</th>
                        <th className={styles.th}>Country</th>
                        <th className={styles.th}>Member Type</th>
                        <th className={styles.th}>Playing Role</th>
                        <th className={styles.th}>Availability</th>
                        <th className={styles.th}>Reserve Price</th>
                        <th className={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player, idx) => {
                        const rowClass =
                          player.status === 'error' ? styles.rowError :
                            player.status === 'success' ? styles.rowSuccess :
                              player.status === 'uploading' ? styles.rowUploading :
                                player.status === 'failed' ? styles.rowFailed : '';

                        return (
                          <tr key={idx} className={rowClass}>
                            <td className={styles.td}>{idx + 1}</td>
                            <td className={styles.td} style={{ fontWeight: 600 }}>
                              {player.data.FirstName} {player.data.Surname}
                            </td>
                            <td className={styles.td}>{player.data.Email}</td>
                            <td className={styles.td}>{player.data.Mobile}</td>
                            <td className={styles.td}>{player.data.SelectedNation}</td>
                            <td className={styles.td} style={{ textTransform: 'capitalize' }}>
                              {player.data.SelectedMember}
                            </td>
                            <td className={styles.td}>{player.data.PlayingRoles}</td>
                            <td className={styles.td} style={{ textTransform: 'capitalize' }}>
                              {player.data.Availability}
                            </td>
                            <td className={styles.td}>
                              {player.data.Availability === 'partial'
                                ? `$${player.data.PerMatchFee} / Match`
                                : `$${player.data.ReservedPrice}`}
                            </td>
                            <td className={styles.td}>
                              {player.status === 'error' && (
                                <span className={`${styles.badge} ${styles.badgeError}`} title={player.message}>
                                  <AlertTriangle size={12} /> Invalid
                                </span>
                              )}
                              {player.status === 'idle' && (
                                <span className={`${styles.badge} ${styles.badgePending}`}>
                                  Ready
                                </span>
                              )}
                              {player.status === 'uploading' && (
                                <span className={`${styles.badge} ${styles.badgeProgress}`}>
                                  <Loader size={12} className={styles.spinner} /> Uploading
                                </span>
                              )}
                              {player.status === 'success' && (
                                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                  <Check size={12} /> Success
                                </span>
                              )}
                              {player.status === 'failed' && (
                                <span className={`${styles.badge} ${styles.badgeError}`} title={player.message}>
                                  <X size={12} /> Failed
                                </span>
                              )}
                              {player.status === 'error' && (
                                <div className={styles.errorCell} title={player.message}>
                                  {player.message}
                                </div>
                              )}
                              {player.status === 'failed' && (
                                <div className={styles.errorCell} title={player.message}>
                                  {player.message}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className={styles.actionButtons}>
                <button
                  className={styles.btnSecondary}
                  onClick={handleReset}
                  disabled={uploading}
                >
                  Clear / Upload New
                </button>

                {!uploadSummary && (
                  <button
                    className={styles.btnPrimary}
                    onClick={handleRegisterPlayers}
                    disabled={uploading || readyCount === 0}
                  >
                    {uploading ? (
                      <>
                        <Loader size={16} className={styles.spinner} />
                        Registering...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Register Players ({readyCount})
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExcelUploadPage;
