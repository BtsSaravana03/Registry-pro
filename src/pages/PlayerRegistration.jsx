import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playerService } from '../services/playerService';
import { ShieldCheck, AlertTriangle, ArrowLeft, CheckCircle2, FileText, Globe, Info, Loader } from 'lucide-react';
import styles from './PlayerRegistration.module.css';

// Import PDF Guidelines asset
import auctionGuidelinesPdf from '../assets/Player auction guidelinesJul28.pdf';

// Dynamic drop-down lists from original EJS
export const FULL_MEMBERS = [
  "England", "Australia", "South Africa", "West Indies", "New Zealand",
  "India", "Pakistan", "Sri Lanka", "Zimbabwe", "Bangladesh"
];

export const OTHER_FULL_MEMBERS = [
  "Afghanistan", "Ireland"
];

export const ASSOCIATE_MEMBERS = [
  "Argentina", "Austria", "Bahamas", "Bahrain", "Belgium", "Belize", "Bermuda",
  "Bhutan", "Botswana", "Brazil", "Bulgaria", "Cambodia", "Cameroon", "Canada",
  "Cayman Islands", "Chile", "China", "Cook Islands", "Costa Rica", "Croatia",
  "Cyprus", "Czech Republic", "Denmark", "Estonia", "Eswatini", "Falkland Islands",
  "Fiji", "Finland", "France", "Gambia", "Germany", "Ghana", "Gibraltar", "Greece",
  "Guernsey", "Hong Kong", "Hungary", "Indonesia", "Iran", "Isle of Man", "Israel",
  "Italy", "Ivory Coast", "Japan", "Jersey", "Kenya", "Lesotho", "Luxembourg",
  "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mexico", "Mongolia",
  "Mozambique", "Myanmar", "Namibia", "Nepal", "Netherlands", "Nigeria", "Norway",
  "Oman", "Panama", "Papua New Guinea", "Peru", "Philippines", "Portugal", "Qatar",
  "Romania", "Rwanda", "Saint Helena", "Samoa", "Scotland", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovenia", "South Korea", "Spain", "Suriname",
  "Sweden", "Switzerland", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste",
  "Turkey", "Turks and Caicos Islands", "Uganda", "United States", "Uzbekistan",
  "Vanuatu", "Zambia"
];

export const COUNTRY_LIST = [
  { name: "Afghanistan", code: "93" },
  { name: "Albania", code: "355" },
  { name: "Algeria", code: "213" },
  { name: "American Samoa", code: "+1-684" },
  { name: "Andorra", code: "376" },
  { name: "Angola", code: "244" },
  { name: "Anguilla", code: "+1-264" },
  { name: "Antigua and Barbuda", code: "+1-268" },
  { name: "Argentina", code: "54" },
  { name: "Armenia", code: "374" },
  { name: "Aruba", code: "297" },
  { name: "Australia", code: "61" },
  { name: "Austria", code: "43" },
  { name: "Azerbaijan", code: "994" },
  { name: "Bahamas", code: "+1-242" },
  { name: "Bahrain", code: "973" },
  { name: "Bangladesh", code: "880" },
  { name: "Barbados", code: "+1-246" },
  { name: "Belarus", code: "375" },
  { name: "Belgium", code: "32" },
  { name: "Belize", code: "501" },
  { name: "Benin", code: "229" },
  { name: "Bhutan", code: "975" },
  { name: "Bolivia", code: "591" },
  { name: "Bosnia and Herzegovina", code: "387" },
  { name: "Botswana", code: "267" },
  { name: "Brazil", code: "55" },
  { name: "Brunei Darussalam", code: "673" },
  { name: "Bulgaria", code: "359" },
  { name: "Burkina Faso", code: "226" },
  { name: "Burundi", code: "257" },
  { name: "Cambodia", code: "855" },
  { name: "Cameroon", code: "237" },
  { name: "Canada", code: "1" },
  { name: "Cape Verde", code: "238" },
  { name: "Cayman Islands", code: "+1-345" },
  { name: "Chad", code: "235" },
  { name: "Chile", code: "56" },
  { name: "China (PRC)", code: "86" },
  { name: "Colombia", code: "57" },
  { name: "Costa Rica", code: "506" },
  { name: "Croatia", code: "385" },
  { name: "Cuba", code: "53" },
  { name: "Cyprus", code: "357" },
  { name: "Czech Republic", code: "420" },
  { name: "Democratic Republic of Congo", code: "243" },
  { name: "Denmark", code: "45" },
  { name: "Djibouti", code: "253" },
  { name: "Dominica", code: "+1-767" },
  { name: "Dominican Republic", code: "+1-809" },
  { name: "Ecuador", code: "593" },
  { name: "Egypt", code: "20" },
  { name: "El Salvador", code: "503" },
  { name: "Eritrea", code: "291" },
  { name: "Estonia", code: "372" },
  { name: "Eswatini (Swaziland)", code: "268" },
  { name: "Ethiopia", code: "251" },
  { name: "Fiji", code: "679" },
  { name: "Finland", code: "358" },
  { name: "France", code: "33" },
  { name: "Gabon", code: "241" },
  { name: "Gambia", code: "220" },
  { name: "Georgia", code: "995" },
  { name: "Germany", code: "49" },
  { name: "Ghana", code: "233" },
  { name: "Gibraltar", code: "350" },
  { name: "Greece", code: "30" },
  { name: "Greenland", code: "299" },
  { name: "Grenada", code: "+1-473" },
  { name: "Guatemala", code: "502" },
  { name: "Guinea", code: "224" },
  { name: "Guinea-Bissau", code: "245" },
  { name: "Guyana", code: "592" },
  { name: "Haiti", code: "509" },
  { name: "Honduras", code: "504" },
  { name: "Hong Kong", code: "852" },
  { name: "Hungary", code: "36" },
  { name: "Iceland", code: "354" },
  { name: "India", code: "91" },
  { name: "Indonesia", code: "62" },
  { name: "Iran", code: "98" },
  { name: "Iraq", code: "964" },
  { name: "Ireland", code: "353" },
  { name: "Israel", code: "972" },
  { name: "Italy", code: "39" },
  { name: "Jamaica", code: "+1-876" },
  { name: "Japan", code: "81" },
  { name: "Jordan", code: "962" },
  { name: "Kazakhstan", code: "7" },
  { name: "Kenya", code: "254" },
  { name: "Kiribati", code: "686" },
  { name: "Kuwait", code: "965" },
  { name: "Kyrgyzstan", code: "996" },
  { name: "Laos", code: "856" },
  { name: "Latvia", code: "371" },
  { name: "Lebanon", code: "961" },
  { name: "Lesotho", code: "266" },
  { name: "Liberia", code: "231" },
  { name: "Libya", code: "218" },
  { name: "Liechtenstein", code: "423" },
  { name: "Lithuania", code: "370" },
  { name: "Luxembourg", code: "352" },
  { name: "North Macedonia", code: "389" },
  { name: "Madagascar", code: "261" },
  { name: "Malawi", code: "265" },
  { name: "Malaysia", code: "60" },
  { name: "Maldives", code: "960" },
  { name: "Mali", code: "223" },
  { name: "Malta", code: "356" },
  { name: "Marshall Islands", code: "692" },
  { name: "Mauritania", code: "222" },
  { name: "Mauritius", code: "230" },
  { name: "Mexico", code: "52" },
  { name: "Micronesia (FS Micronesia)", code: "691" },
  { name: "Moldova", code: "373" },
  { name: "Monaco", code: "377" },
  { name: "Mongolia", code: "976" },
  { name: "Montenegro", code: "382" },
  { name: "Morocco", code: "212" },
  { name: "Mozambique", code: "258" },
  { name: "Myanmar (Burma)", code: "95" },
  { name: "Namibia", code: "264" },
  { name: "Nauru", code: "674" },
  { name: "Nepal", code: "977" },
  { name: "Netherlands", code: "31" },
  { name: "New Zealand", code: "64" },
  { name: "Nicaragua", code: "505" },
  { name: "Niger", code: "227" },
  { name: "Nigeria", code: "234" },
  { name: "Niue", code: "683" },
  { name: "Norway", code: "47" },
  { name: "Oman", code: "968" },
  { name: "Pakistan", code: "92" },
  { name: "Palau", code: "680" },
  { name: "Panama", code: "507" },
  { name: "Papua New Guinea", code: "675" },
  { name: "Paraguay", code: "595" },
  { name: "Peru", code: "51" },
  { name: "Philippines", code: "63" },
  { name: "Poland", code: "48" },
  { name: "Portugal", code: "351" },
  { name: "Qatar", code: "974" },
  { name: "Romania", code: "40" },
  { name: "Russia", code: "7" },
  { name: "Rwanda", code: "250" },
  { name: "Saint Kitts & Nevis", code: "+1-869" },
  { name: "Saint Lucia", code: "+1-758" },
  { name: "Saint Vincent & Grenadines", code: "+1-784" },
  { name: "Samoa", code: "685" },
  { name: "San Marino", code: "378" },
  { name: "Sao Tome & Principe", code: "239" },
  { name: "Saudi Arabia", code: "966" },
  { name: "Senegal", code: "221" },
  { name: "Serbia", code: "381" },
  { name: "Seychelles", code: "248" },
  { name: "Sierra Leone", code: "232" },
  { name: "Singapore", code: "65" },
  { name: "Slovakia", code: "421" },
  { name: "Slovenia", code: "386" },
  { name: "Solomon Islands", code: "677" },
  { name: "Somalia", code: "252" },
  { name: "South Africa", code: "27" },
  { name: "South Korea", code: "82" },
  { name: "South Sudan", code: "211" },
  { name: "Spain", code: "34" },
  { name: "Sri Lanka", code: "94" },
  { name: "Sudan", code: "249" },
  { name: "Suriname", code: "597" },
  { name: "Sweden", code: "46" },
  { name: "Switzerland", code: "41" },
  { name: "Syria", code: "963" },
  { name: "Taiwan", code: "886" },
  { name: "Tajikistan", code: "992" },
  { name: "Tanzania", code: "255" },
  { name: "Thailand", code: "66" },
  { name: "Timor-Leste (East Timor)", code: "670" },
  { name: "Togo", code: "228" },
  { name: "Tonga", code: "676" },
  { name: "Trinidad & Tobago", code: "+1-868" },
  { name: "Tunisia", code: "216" },
  { name: "Turkey", code: "90" },
  { name: "Turkmenistan", code: "993" },
  { name: "Tuvalu", code: "688" },
  { name: "Uganda", code: "256" },
  { name: "Ukraine", code: "380" },
  { name: "United Arab Emirates", code: "971" },
  { name: "United Kingdom", code: "44" },
  { name: "United States", code: "1" },
  { name: "Uruguay", code: "598" },
  { name: "Uzbekistan", code: "998" },
  { name: "Vanuatu", code: "678" },
  { name: "Vatican City", code: "+379" },
  { name: "Venezuela", code: "58" },
  { name: "Vietnam", code: "84" },
  { name: "Yemen", code: "967" },
  { name: "Zambia", code: "260" },
  { name: "Zimbabwe", code: "263" }
];

const PlayerRegistrationPage = () => {
  const { league, loginData } = useAuth();
  const navigate = useNavigate();

  // Basic fields state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');

  // Dynamic fields state
  const [classification, setClassification] = useState('');
  const [selectedNation, setSelectedNation] = useState('');
  const [availability, setAvailability] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [perMatchFee, setPerMatchFee] = useState('');
  const [role, setRole] = useState('Select');
  const [battingType, setBattingType] = useState('Select');
  const [bowlingType, setBowlingType] = useState('Select');
  const [profileLinkType, setProfileLinkType] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedCategory, setVerifiedCategory] = useState(null);

  // Lock status for pricing constraints
  const [lockedByPerMatch, setLockedByPerMatch] = useState(false);
  const [lockedByReserve, setLockedByReserve] = useState(false);

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

  const verifyProfileUrl = async () => {
    if (!profileUrl.trim()) {
      triggerAlert("Please enter a valid Cricinfo Profile URL.");
      return;
    }
    const playerId = extractCricinfoPlayerId(profileUrl);
    if (!playerId) {
      triggerAlert("Invalid Cricinfo URL. Please make sure the domain is www.espncricinfo.com or www.cricinfo.com and contains player ID at the end.");
      return;
    }
    try {
      const response = await fetch(`https://cloud.cricket-21.com/OtherSportsApi/cricket/category/${playerId}`);
      const data = await response.json();
      if (data && data.success) {
        const cat = data.category;
        setVerifiedCategory(cat);
        setIsVerified(true);
        if (cat === 'A') {
          setReservePrice('80000');
          setPerMatchFee('8000');
        } else if (cat === 'B') {
          setReservePrice('40000');
          setPerMatchFee('4000');
        } else if (cat === 'C') {
          setReservePrice('10000');
          setPerMatchFee('1000');
        }
        let eligiblePrice = "10,000";
        if (cat === 'A') eligiblePrice = "80,000";
        if (cat === 'B') eligiblePrice = "40,000";
        triggerAlert(`Verification successful! Based on Category ${cat}, you are eligible for USD $${eligiblePrice}.`);
      } else {
        triggerAlert("Verification failed. Player category could not be retrieved.");
      }
    } catch (error) {
      console.error(error);
      triggerAlert("An error occurred while verifying the profile URL.");
    }
  };

  // Search state for country code
  const [ccSearchText, setCcSearchText] = useState('');
  const [showCcDropdown, setShowCcDropdown] = useState(false);
  const ccDropdownRef = useRef(null);

  // Modals state
  const [showUaeEligibilityModal, setShowUaeEligibilityModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null
  });
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '' });
  const triggerAlert = (message) => {
    setAlertModal({ isOpen: true, message });
  };

  // Re-registration popup state (if player already exists)
  const [showAlreadyExistModal, setShowAlreadyExistModal] = useState(false);
  const [existingPlayerData, setExistingPlayerData] = useState(null);
  const [reregisterRefNo, setReregisterRefNo] = useState('');
  const [reregisterError, setReregisterError] = useState('');

  // Form submitting and page state
  const [submitting, setSubmitting] = useState(false);

  // Check authorization
  const isAuthorized = league?.id === 'ILT' && loginData?.agentId !== 100;

  // Handles clicking outside to close searchable country code dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ccDropdownRef.current && !ccDropdownRef.current.contains(event.target)) {
        setShowCcDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to check if Afghanistan or Ireland is selected
  const isAfgOrIre = selectedNation === 'Afghanistan' || selectedNation === 'Ireland' || classification === 'Afghanistan' || classification === 'Ireland';

  // Helper to trigger the custom confirm modal
  const triggerConfirmModal = (message, onConfirm, onCancel) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm,
      onCancel
    });
  };

  // Sync pricing locks when Per Match Fee changes
  const handlePerMatchFeeChange = (val) => {
    if (val === '') {
      setReservePrice('');
      setLockedByPerMatch(false);
      return;
    }

    if (isAfgOrIre) {
      if (profileLinkType === '1') {
        if (!isVerified) {
          triggerAlert("please enter the cricinfo profile to verify your base price");
          return;
        }
        if (verifiedCategory === 'C' && val !== '1000') return;
        if (verifiedCategory === 'B' && val === '8000') return;
      } else if (profileLinkType === '0') {
        if (val === '4000') {
          triggerConfirmModal(
            "The player must have been capped at international level and or have played in DP World ILT20 previously.",
            () => {
              setPerMatchFee('4000');
              setReservePrice('40000');
              setLockedByPerMatch(true);
              setLockedByReserve(false);
            },
            () => { }
          );
          return;
        } else if (val === '8000') {
          triggerConfirmModal(
            "The player must have been capped 100 or more times at international level (may be cumulative across Tests, ODI and IT20).",
            () => {
              setPerMatchFee('8000');
              setReservePrice('80000');
              setLockedByPerMatch(true);
              setLockedByReserve(false);
            },
            () => { }
          );
          return;
        }
      }
    }

    setPerMatchFee(val);

    // Map value to Reserve Price (Match Fee * 10)
    let reserveVal = "80000";
    if (val === "1000") reserveVal = "10000";
    else if (val === "2000") reserveVal = "20000";
    else if (val === "4000") reserveVal = "40000";

    setReservePrice(reserveVal);
    setLockedByPerMatch(true);
    setLockedByReserve(false);
  };

  // Sync pricing locks when Reserve Price changes
  const handleReservePriceChange = (val) => {
    if (val === '') {
      setPerMatchFee('');
      setLockedByReserve(false);
      return;
    }

    if (isAfgOrIre) {
      if (profileLinkType === '1') {
        if (!isVerified) {
          triggerAlert("please enter the cricinfo profile to verify your base price");
          return;
        }
        if (verifiedCategory === 'C' && val !== '10000') return;
        if (verifiedCategory === 'B' && val === '80000') return;
      } else if (profileLinkType === '0') {
        if (val === '40000') {
          triggerConfirmModal(
            "The player must have been capped at international level and/or have played in DP World ILT20 previously.",
            () => {
              setReservePrice('40000');
              setPerMatchFee('4000');
              setLockedByReserve(true);
              setLockedByPerMatch(false);
            },
            () => { }
          );
          return;
        } else if (val === '80000') {
          triggerConfirmModal(
            "They must have been capped 100 or more times at international level (may be cumulative across Tests, ODI and IT20).",
            () => {
              setReservePrice('80000');
              setPerMatchFee('8000');
              setLockedByReserve(true);
              setLockedByPerMatch(false);
            },
            () => { }
          );
          return;
        }
      }
    }

    setReservePrice(val);

    // Map value to Match Fee (Reserve Price / 10)
    let feeVal = "8000";
    if (val === "10000") feeVal = "1000";
    else if (val === "20000") feeVal = "2000";
    else if (val === "40000") feeVal = "4000";

    setPerMatchFee(feeVal);
    setLockedByReserve(true);
    setLockedByPerMatch(false);
  };

  // Reset pricing locks completely
  const handleResetPricing = () => {
    if (classification === 'UAE') {
      setReservePrice('10000');
      setPerMatchFee('1000');
      setLockedByReserve(true);
      setLockedByPerMatch(false);
      return;
    }
    setPerMatchFee('');
    setReservePrice('');
    setLockedByPerMatch(false);
    setLockedByReserve(false);
  };

  // Clear all states
  const clearForm = () => {
    setFirstName('');
    setLastName('');
    setCountryCode('');
    setCcSearchText('');
    setMobile('');
    setDob('');
    setEmail('');
    setClassification('');
    setSelectedNation('');
    setAvailability('');
    setFromDate('');
    setToDate('');
    setPerMatchFee('');
    setRole('Select');
    setBattingType('Select');
    setBowlingType('Select');
    setProfileLinkType('');
    setProfileUrl('');
    setReservePrice('');
    setIsVerified(false);
    setVerifiedCategory(null);
    setLockedByPerMatch(false);
    setLockedByReserve(false);
  };

  // Triggered when Player Classification changes
  const handleClassificationChange = (val) => {
    setClassification(val);
    setSelectedNation('');
    setIsVerified(false);
    setVerifiedCategory(null);
    if (val === 'UAE') {
      setShowUaeEligibilityModal(true);
      setReservePrice('10000');
      setPerMatchFee('1000');
      setLockedByReserve(true);
      setLockedByPerMatch(false);
    } else if (val === 'Afghanistan' || val === 'Ireland') {
      setSelectedNation(val);
      setProfileLinkType(''); // let user choose between CricInfo and CricClubs
      setReservePrice('');
      setPerMatchFee('');
      setLockedByReserve(false);
      setLockedByPerMatch(false);
    } else {
      handleResetPricing();
    }
  };

  // Handler for nation change (select dropdown)
  const handleNationChange = (val) => {
    setSelectedNation(val);
    setIsVerified(false);
    setVerifiedCategory(null);
    if (val === 'Afghanistan' || val === 'Ireland') {
      setClassification(val);
      setProfileLinkType(''); // let user choose between CricInfo and CricClubs
      setReservePrice('');
      setPerMatchFee('');
      setLockedByReserve(false);
      setLockedByPerMatch(false);
    } else {
      handleResetPricing();
    }
  };

  // Form Validation logic
  const validateForm = () => {
    if (!firstName.trim()) return "Please enter First Name.";
    if (!lastName.trim()) return "Please enter Last Name (Surname).";
    if (!countryCode) return "Please select Country Code.";

    if (!mobile.trim()) return "Please enter Mobile Number.";
    if (!/^\d{7,10}$/.test(mobile.trim())) return "Mobile Number must be between 7 to 10 digits.";

    if (!dob) return "Please select Date of Birth.";
    const birthDate = new Date(dob);
    const maxDobLimit = new Date("2015-12-31");
    if (birthDate > maxDobLimit) return "Date of Birth cannot be after 2015.";

    const emailFilter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!email.trim()) return "Please enter Email.";
    if (!emailFilter.test(email.trim())) return "Please enter a valid email address.";

    if (!classification) return "Please select Player Classification.";

    if (classification !== 'UAE' && !selectedNation) {
      return "Please select a Member Nation Country.";
    }

    if (!availability) return "Please select Availability.";

    if (availability === 'partial') {
      if (!fromDate || !toDate) return "Please select available dates range.";
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (start > end) return "From Date cannot be after To Date.";

      const minDateLimit = new Date("2026-11-22");
      const maxDateLimit = new Date("2026-12-20");
      if (start < minDateLimit || end > maxDateLimit) {
        return "Availability Dates must fall between 11/22/2026 and 12/20/2026.";
      }

      if (!perMatchFee) return "Please select Match fee per match.";
    }

    if (role === 'Select') return "Please select Playing Role.";

    if (['Batsman', 'Wicket Keeper', 'Bowler', 'All Rounder'].includes(role) && battingType === 'Select') {
      return "Please select Batting Type.";
    }

    if (['Bowler', 'All Rounder'].includes(role) && bowlingType === 'Select') {
      return "Please select Bowling Type.";
    }

    if (!profileLinkType) return "Please select Player Profile Link type (CricInfo or CricClubs).";

    if (!profileUrl.trim()) return `Please enter ${profileLinkType === '1' ? 'CricInfo' : 'CricClubs'} Profile Link.`;

    try {
      const url = new URL(profileUrl.trim());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return "Please enter a valid profile URL (http:// or https://).";
      }
    } catch (_) {
      return "Please enter a valid profile URL.";
    }

    if (isAfgOrIre && profileLinkType === '1' && !isVerified) {
      return "please enter the cricinfo profile to verify your base price";
    }

    if (!reservePrice) return "Please select a Reserve Price.";

    return null; // Form is valid
  };

  // Main submission dispatcher
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) {
      triggerAlert(errorMsg);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Fetch playervalidationstatus config
      const validationConfig = await playerService.getPlayerValidationConfig();
      const isPlayerValidationVal = validationConfig?.validation?.toString() || "0";

      // 2. Build details payload
      const userDetails = {
        FirstName: firstName.trim(),
        MiddleName: "",
        Surname: lastName.trim(),
        Mobile: mobile.trim(),
        DOB: dob,
        Email: email.trim(),
        State: "",
        TrialCity: "",
        TrialZone: "",
        PlayingRoles: role,
        BattingHandedness: battingType === 'Select' ? '' : battingType,
        PreferredBowlingStyle: bowlingType === 'Select' ? '' : bowlingType,
        PreferredBattingOrders: "",
        Password: "",
        ConfirmPassword: "",
        Reregister: "Initial",
        ReferenceNo: "",
        SelectedMember: classification,
        SelectedNation: classification === 'UAE' ? 'United Arab Emirates' : selectedNation,
        CricinfoLink: profileUrl.trim(),
        isCricInfolink: Number(profileLinkType), // 1 = CricInfo, 0 = CricClubs
        ReservedPrice: Number(reservePrice),
        passporturl: "",
        isPassport: 1,
        gccurl: "",
        emiratesidurl: "",
        AgentId: Number(loginData?.agentId || 100),
        PerMatchFee: availability === 'partial' ? perMatchFee : (reservePrice ? (Number(reservePrice) / 10).toString() : ""),
        Availability: availability,
        FromDate: availability === 'partial' ? fromDate : "",
        toDate: availability === 'partial' ? toDate : "",
        Reason: "",
        IsEligibleUAEplayer: classification === 'UAE' ? "1" : "0",
        CountryCode: countryCode,
        isPlayerValidation: isPlayerValidationVal,
        PlayerValidated: "0",
        Checkout: "RegILT"
      };

      // 3. Dispatch to API
      const result = await playerService.registerPlayer(userDetails);

      if (!result.success && result.alreadyExist === 1) {
        // Player already exists, show Reference Modal
        setExistingPlayerData(result.data || { FirstName: firstName, Mobile: mobile, Email: email });
        setReregisterRefNo('');
        setReregisterError('');
        setShowAlreadyExistModal(true);
      } else if (result.success) {
        // Success
        setSuccessDetails({
          playerName: result.playername || `${firstName} ${lastName}`,
          refNo: result.referenceNo || result.ReferenceNo || "N/A"
        });
        clearForm();
        setShowSuccessModal(true);
      } else {
        triggerAlert(result.message || "Registration failed. Please check details and try again.");
      }
    } catch (err) {
      console.error("Registration dispatch error:", err);
      triggerAlert("Network or API error occurred during registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Re-register payment dispatcher
  const handleReregisterSubmit = async () => {
    if (!reregisterRefNo.trim()) {
      setReregisterError("Please enter Reference Number.");
      return;
    }

    setSubmitting(true);
    setReregisterError('');

    try {
      const validationConfig = await playerService.getPlayerValidationConfig();
      const isPlayerValidationVal = validationConfig?.validation?.toString() || "0";

      const userDetails = {
        FirstName: firstName.trim(),
        MiddleName: "",
        Surname: lastName.trim(),
        Mobile: mobile.trim(),
        DOB: dob,
        Email: email.trim(),
        State: "",
        TrialCity: "",
        TrialZone: "",
        PlayingRoles: role,
        BattingHandedness: battingType === 'Select' ? '' : battingType,
        PreferredBowlingStyle: bowlingType === 'Select' ? '' : bowlingType,
        PreferredBattingOrders: "",
        Password: "",
        ConfirmPassword: "",
        Reregister: "Reregister",
        ReferenceNo: reregisterRefNo.trim(),
        SelectedMember: classification,
        SelectedNation: classification === 'UAE' ? 'United Arab Emirates' : selectedNation,
        CricinfoLink: profileUrl.trim(),
        isCricInfolink: Number(profileLinkType),
        ReservedPrice: Number(reservePrice),
        passporturl: "",
        isPassport: 1,
        gccurl: "",
        emiratesidurl: "",
        AgentId: Number(loginData?.agentId || 100),
        PerMatchFee: availability === 'partial' ? perMatchFee : (reservePrice ? (Number(reservePrice) / 10).toString() : ""),
        Availability: availability,
        FromDate: availability === 'partial' ? fromDate : "",
        toDate: availability === 'partial' ? toDate : "",
        Reason: "",
        IsEligibleUAEplayer: classification === 'UAE' ? "1" : "0",
        CountryCode: countryCode,
        isPlayerValidation: isPlayerValidationVal,
        PlayerValidated: "0",
        Checkout: "RegILT"
      };

      const result = await playerService.registerPlayer(userDetails);

      if (result.success) {
        setShowAlreadyExistModal(false);
        setSuccessDetails({
          playerName: result.playername || result.firstSurName || `${firstName} ${lastName}`,
          refNo: result.referenceNo || result.ReferenceNo || result.resultRefNo || reregisterRefNo
        });
        clearForm();
        setShowSuccessModal(true);
      } else {
        if (result.referenceNo === "MisMatch") {
          setReregisterError("Reference Number does not match. Please verify and try again.");
        } else {
          setReregisterError(result.message || "Validation failed.");
        }
      }
    } catch (err) {
      console.error("Re-register dispatch error:", err);
      setReregisterError("Unable to validate re-registration. Check connectivity.");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Unauthorized State
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
            className={`btn btn-primary ${styles.backBtn}`}
          >
            <ArrowLeft size={16} /> Return to Players List
          </button>
        </div>
      </div>
    );
  }

  // Filter country codes based on search input
  const filteredCountryCodes = ccSearchText.trim()
    ? COUNTRY_LIST.filter(c =>
      c.name.toLowerCase().includes(ccSearchText.toLowerCase()) ||
      c.code.includes(ccSearchText)
    )
    : COUNTRY_LIST;

  const currentCountryCodeObj = COUNTRY_LIST.find(c => c.code === countryCode);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Register a Player</h1>
          <p className={styles.subtitle}>
            Enter player credentials, member classifications, roles, and pricing availability to submit the registry.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          {/* First Name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>First Name<span className={styles.required}>*</span></label>
            <input
              type="text"
              className={styles.textInput}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
            />
          </div>

          {/* Last Name */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Last Name (Surname)<span className={styles.required}>*</span></label>
            <input
              type="text"
              className={styles.textInput}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
            />
          </div>

          {/* Country Code Selection */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Country Code<span className={styles.required}>*</span></label>
            <div className={styles.searchDropdownWrapper} ref={ccDropdownRef}>
              <input
                type="text"
                className={styles.textInput}
                value={showCcDropdown ? ccSearchText : (currentCountryCodeObj ? `${currentCountryCodeObj.name} (+${currentCountryCodeObj.code})` : 'Select Country')}
                onFocus={() => {
                  setCcSearchText('');
                  setShowCcDropdown(true);
                }}
                onChange={(e) => setCcSearchText(e.target.value)}
                placeholder="Type to search country code..."
              />
              {showCcDropdown && (
                <ul className={styles.searchDropdownList}>
                  {filteredCountryCodes.length > 0 ? (
                    filteredCountryCodes.map(c => (
                      <li
                        key={`${c.name}-${c.code}`}
                        className={styles.searchDropdownItem}
                        onClick={() => {
                          setCountryCode(c.code);
                          setShowCcDropdown(false);
                        }}
                      >
                        {c.name} (+{c.code})
                      </li>
                    ))
                  ) : (
                    <li className={styles.searchDropdownEmpty}>No country found</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* Mobile Number */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mobile Number<span className={styles.required}>*</span></label>
            <input
              type="text"
              className={styles.textInput}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Mobile Number (7-10 digits)"
              maxLength={10}
              required
            />
          </div>

          {/* Date of Birth */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date of Birth<span className={styles.required}>*</span></label>
            <input
              type="date"
              className={styles.textInput}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email<span className={styles.required}>*</span></label>
            <input
              type="email"
              className={styles.textInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
            />
          </div>

          {/* Player Classification */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>Player Category<span className={styles.required}>*</span></label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="classification"
                  className={styles.radioInput}
                  checked={classification === 'Afghanistan'}
                  onChange={() => handleClassificationChange('Afghanistan')}
                />
                AFGHANISTAN
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="classification"
                  className={styles.radioInput}
                  checked={classification === 'Ireland'}
                  onChange={() => handleClassificationChange('Ireland')}
                />
                IRELAND
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="classification"
                  className={styles.radioInput}
                  checked={classification === 'ICC Full Member'}
                  onChange={() => handleClassificationChange('ICC Full Member')}
                />
                ICC FULL MEMBER
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="classification"
                  className={styles.radioInput}
                  checked={classification === 'ICC Associate Member'}
                  onChange={() => handleClassificationChange('ICC Associate Member')}
                />
                ICC ASSOCIATE MEMBER
              </label>
            </div>
          </div>

          {/* Selected Member Country (Dropdown if full/associate selected) */}
          {classification && (classification === 'ICC Full Member' || classification === 'ICC Associate Member') && (
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>Member Nation Country<span className={styles.required}>*</span></label>
              <select
                className={styles.selectInput}
                value={selectedNation}
                onChange={(e) => handleNationChange(e.target.value)}
                required
              >
                <option value="" disabled>Select Country</option>
                {classification === 'ICC Full Member' && FULL_MEMBERS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                {classification === 'ICC Associate Member' && ASSOCIATE_MEMBERS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Availability options */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>Availability<span className={styles.required}>*</span></label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="availability"
                  className={styles.radioInput}
                  checked={availability === 'full'}
                  onChange={() => {
                    setAvailability('full');
                    handleResetPricing();
                  }}
                />
                Full
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="availability"
                  className={styles.radioInput}
                  checked={availability === 'partial'}
                  onChange={() => setAvailability('partial')}
                />
                Partial
              </label>
            </div>
          </div>

          {/* Partial Dates Selection */}
          {availability === 'partial' && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Available From Date<span className={styles.required}>*</span></label>
                <input
                  type="date"
                  className={styles.textInput}
                  min="2026-11-22"
                  max="2026-12-20"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Available To Date<span className={styles.required}>*</span></label>
                <input
                  type="date"
                  className={styles.textInput}
                  min="2026-11-22"
                  max="2026-12-20"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                />
              </div>

              {/* Match fee per match (Radio options) */}
              <div className={`${styles.formGroup} ${styles.fullWidth} ${(lockedByReserve || classification === 'UAE') ? styles.lockedGroup : ''}`}>
                <label className={styles.formLabel}>Match fee per match in (USD)<span className={styles.required}>*</span></label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="perMatchFee"
                      className={styles.radioInput}
                      checked={perMatchFee === '1000'}
                      onChange={() => handlePerMatchFeeChange('1000')}
                      disabled={lockedByReserve || classification === 'UAE' || !profileLinkType || (isAfgOrIre && profileLinkType === '1' && !isVerified)}
                    />
                    {isAfgOrIre ? "1,000" : "1,000"}
                  </label>
                  {isAfgOrIre ? (
                    <>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="perMatchFee"
                          className={styles.radioInput}
                          checked={perMatchFee === '4000'}
                          onChange={() => handlePerMatchFeeChange('4000')}
                          disabled={lockedByReserve || !profileLinkType || (profileLinkType === '1' && (!isVerified || verifiedCategory === 'C'))}
                        />
                        4,000
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="perMatchFee"
                          className={styles.radioInput}
                          checked={perMatchFee === '8000'}
                          onChange={() => handlePerMatchFeeChange('8000')}
                          disabled={lockedByReserve || !profileLinkType || (profileLinkType === '1' && (!isVerified || verifiedCategory === 'C' || verifiedCategory === 'B'))}
                        />
                        8,000
                      </label>
                    </>
                  ) : (
                    <>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="perMatchFee"
                          className={styles.radioInput}
                          checked={perMatchFee === '4000'}
                          onChange={() => handlePerMatchFeeChange('4000')}
                          disabled={lockedByReserve || classification === 'UAE' || !profileLinkType}
                        />
                        4,000
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="perMatchFee"
                          className={styles.radioInput}
                          checked={perMatchFee === '8000'}
                          onChange={() => handlePerMatchFeeChange('8000')}
                          disabled={lockedByReserve || classification === 'UAE' || !profileLinkType}
                        />
                        8,000
                      </label>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Playing Role */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>Role<span className={styles.required}>*</span></label>
            <select
              className={styles.selectInput}
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setBattingType('Select');
                setBowlingType('Select');
              }}
              required
            >
              <option value="Select">Select Playing Role</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="Wicket Keeper">Wicket Keeper</option>
              <option value="All Rounder">All Rounder</option>
            </select>
          </div>

          {/* Batting Type Selector (visible for all valid roles) */}
          {['Batsman', 'Wicket Keeper', 'Bowler', 'All Rounder'].includes(role) && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Batting Type<span className={styles.required}>*</span></label>
              <select
                className={styles.selectInput}
                value={battingType}
                onChange={(e) => setBattingType(e.target.value)}
                required
              >
                <option value="Select">Select Batting Type</option>
                <option value="RHB">RHB (Right Hand Bat)</option>
                <option value="LHB">LHB (Left Hand Bat)</option>
              </select>
            </div>
          )}

          {/* Bowling Type Selector (visible only for Bowler/All Rounder) */}
          {['Bowler', 'All Rounder'].includes(role) && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Bowling Type<span className={styles.required}>*</span></label>
              <select
                className={styles.selectInput}
                value={bowlingType}
                onChange={(e) => setBowlingType(e.target.value)}
                required
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

          {/* Player Profile Link Selection */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.formLabel}>Player Profile Link Type<span className={styles.required}>*</span></label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="profileLinkType"
                  className={styles.radioInput}
                  checked={profileLinkType === '1'}
                  onChange={() => setProfileLinkType('1')}
                />
                CricInfo
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="profileLinkType"
                  className={styles.radioInput}
                  checked={profileLinkType === '0'}
                  onChange={() => setProfileLinkType('0')}
                />
                CricClubs
              </label>
            </div>
          </div>

          {/* Profile URL Input */}
          {profileLinkType && (
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.formLabel}>
                {profileLinkType === '1' ? 'CricInfo' : 'CricClubs'} Profile URL<span className={styles.required}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                <input
                  type="text"
                  className={styles.textInput}
                  value={profileUrl}
                  onChange={(e) => {
                    setProfileUrl(e.target.value);
                    setIsVerified(false);
                    setVerifiedCategory(null);
                  }}
                  placeholder={`https://www.${profileLinkType === '1' ? 'espncricinfo.com' : 'cricclubs.com'}/...`}
                  required
                  style={{ flex: 1 }}
                />
                {isAfgOrIre && profileLinkType === '1' && (
                  <button
                    type="button"
                    className={styles.btnVerify}
                    onClick={verifyProfileUrl}
                    style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reserve Price (Radio options) */}
          <div className={`${styles.formGroup} ${styles.fullWidth} ${(lockedByPerMatch || classification === 'UAE') ? styles.lockedGroup : ''}`}>
            <label className={styles.formLabel}>Reserve Price in (USD)<span className={styles.required}>*</span></label>
            <div className={styles.radioGroup}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="reservePrice"
                  className={styles.radioInput}
                  checked={reservePrice === '10000'}
                  onChange={() => handleReservePriceChange('10000')}
                  disabled={lockedByPerMatch || classification === 'UAE' || !profileLinkType || (isAfgOrIre && profileLinkType === '1' && !isVerified)}
                />
                {isAfgOrIre ? "10,000" : "10,000"}
              </label>
              {isAfgOrIre ? (
                <>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="reservePrice"
                      className={styles.radioInput}
                      checked={reservePrice === '40000'}
                      onChange={() => handleReservePriceChange('40000')}
                      disabled={lockedByPerMatch || !profileLinkType || (profileLinkType === '1' && (!isVerified || verifiedCategory === 'C'))}
                    />
                    40,000
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="reservePrice"
                      className={styles.radioInput}
                      checked={reservePrice === '80000'}
                      onChange={() => handleReservePriceChange('80000')}
                      disabled={lockedByPerMatch || !profileLinkType || (profileLinkType === '1' && (!isVerified || verifiedCategory === 'C' || verifiedCategory === 'B'))}
                    />
                    80,000
                  </label>
                </>
              ) : (
                <>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="reservePrice"
                      className={styles.radioInput}
                      checked={reservePrice === '40000'}
                      onChange={() => handleReservePriceChange('40000')}
                      disabled={lockedByPerMatch || classification === 'UAE' || !profileLinkType}
                    />
                    40,000
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="reservePrice"
                      className={styles.radioInput}
                      checked={reservePrice === '80000'}
                      onChange={() => handleReservePriceChange('80000')}
                      disabled={lockedByPerMatch || classification === 'UAE' || !profileLinkType}
                    />
                    80,000
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Unlock / Reset Pricing button (shows up only if locked) */}
          {(lockedByPerMatch || lockedByReserve) && classification !== 'UAE' && (
            <div className={styles.fullWidth} style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className={styles.btnGuidelines}
                onClick={handleResetPricing}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderStyle: 'solid' }}
              >
                Clear Pricing Restrictions
              </button>
            </div>
          )}

          {/* Auction Guidelines Link and Submit Button */}
          <div className={`${styles.fullWidth} d-flex flex-column gap-3 mt-3`}>
            <button
              type="button"
              className={styles.btnGuidelines}
              onClick={() => setShowGuidelinesModal(true)}
            >
              <FileText size={16} /> Auction guidelines
            </button>

            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Processing Submission...
                </>
              ) : (
                'Register Player'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL 1: UAE ELIGIBILITY WARNING */}
      {showUaeEligibilityModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>UAE Player Registry Compliance</h3>
              <button className={styles.modalClose} onClick={() => setShowUaeEligibilityModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p>
                UAE Players who sign up for the DP World ILT20 Development Tournament will automatically be registered in the DP World ILT20 Auction.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-primary" onClick={() => setShowUaeEligibilityModal(false)}>
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GUIDELINES PDF VIEW */}
      {showGuidelinesModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} ${styles.modalGuidelinesCard}`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Player Auction Guidelines</h3>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => window.open(auctionGuidelinesPdf, '_blank')}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Open in New Tab
                </button>
                <button className={styles.modalClose} onClick={() => setShowGuidelinesModal(false)}>×</button>
              </div>
            </div>
            <div className={styles.modalBody} style={{ padding: 0 }}>
              <iframe
                src={auctionGuidelinesPdf}
                className={styles.pdfFrame}
                title="Player Auction Guidelines"
              />
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline" onClick={() => setShowGuidelinesModal(false)}>
                Close Guidelines
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REGISTRATION SUCCESS CARD */}
      {showSuccessModal && successDetails && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Registration Successful</h3>
              <button className={styles.modalClose} onClick={() => setShowSuccessModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.successTemplate}>
                <div className={styles.successHeader}>
                  <CheckCircle2 size={48} style={{ marginBottom: '1rem' }} />
                  <div>Player Registered Completed!</div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Dear <strong>{successDetails.playerName}</strong>,
                  <br /><br />
                  Thank you for registering for the <strong>ILT20 2026.</strong> Your Registration is complete!
                </p>

                <div className={styles.infoBlock}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Reference Number</span>
                    <span className={styles.infoVal}>{successDetails.refNo}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  We look forward to having you on board.
                  <br />
                  Sincerely,
                  <br />
                  The ILT20 Team
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ALREADY EXISTS REFERENCE INPUT */}
      {showAlreadyExistModal && existingPlayerData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Player Already Registered</h3>
              <button className={styles.modalClose} onClick={() => setShowAlreadyExistModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className="d-flex flex-column gap-3">
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)' }}>
                  A player with matching email or mobile number already exists in the system registry.
                </p>

                <div className={styles.infoBlock}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Player Name:</span>
                    <span className={styles.infoVal}>{existingPlayerData.FirstName}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Mobile:</span>
                    <span className={styles.infoVal}>{existingPlayerData.Mobile || existingPlayerData.MobileNumber}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoKey}>Email:</span>
                    <span className={styles.infoVal}>{existingPlayerData.Email}</span>
                  </div>
                </div>

                {/* <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Enter Reference Number to Validate:</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={reregisterRefNo}
                    onChange={(e) => setReregisterRefNo(e.target.value)}
                    placeholder="Enter Reference Number"
                  />
                  {reregisterError && (
                    <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem', fontWeight: 500 }}>
                      ⚠️ {reregisterError}
                    </div>
                  )}
                </div> */}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowAlreadyExistModal(false)}
              >
                Cancel
              </button>
              {/* <button
                type="button"
                className="btn btn-primary"
                onClick={handleReregisterSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader className={styles.spinner} /> : 'Validate & Save'}
              </button> */}
            </div>
          </div>
        </div>
      )}
      {/* MODAL 5: ELIGIBILITY CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Eligibility Verification</h3>
              <button className={styles.modalClose} onClick={() => {
                if (confirmModal.onCancel) confirmModal.onCancel();
                setConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null });
              }}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem' }}>
                {confirmModal.message}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-outline" onClick={() => {
                if (confirmModal.onCancel) confirmModal.onCancel();
                setConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null });
              }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => {
                if (confirmModal.onConfirm) confirmModal.onConfirm();
                setConfirmModal({ isOpen: false, message: '', onConfirm: null, onCancel: null });
              }}>
                Verify & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 6: ALERT MODAL */}
      {alertModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Alert</h3>
              <button className={styles.modalClose} onClick={() => setAlertModal({ isOpen: false, message: '' })}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.95rem' }}>
                {alertModal.message}
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className="btn btn-primary" onClick={() => setAlertModal({ isOpen: false, message: '' })}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRegistrationPage;
