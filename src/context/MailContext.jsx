import React, { createContext, useContext, useState, useEffect } from 'react';

const MailContext = createContext();

export const MailProvider = ({ children }) => {
  const [invalidPassportList, setInvalidPassportList] = useState(() => {
    try {
      const saved = localStorage.getItem('player_registry_invalid_passport');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [noPassportList, setNoPassportList] = useState(() => {
    try {
      const saved = localStorage.getItem('player_registry_no_passport');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('player_registry_invalid_passport', JSON.stringify(invalidPassportList));
    } catch (e) {
      console.error('Failed to save invalid passport list:', e);
    }
  }, [invalidPassportList]);

  useEffect(() => {
    try {
      localStorage.setItem('player_registry_no_passport', JSON.stringify(noPassportList));
    } catch (e) {
      console.error('Failed to save no passport list:', e);
    }
  }, [noPassportList]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addToInvalidPassport = (player) => {
    const refno = player.refno || player.ReferenceNo || player.RegistrationNo || player.ID || player.Id;
    const firstname = player.firstname || player.FirstName || player.PlayerName || player.Name || '';
    const email = player.email || player.Email || '';
    const playerName = player.playerName || `${player.FirstName || ''} ${player.Surname || ''}`.trim() || firstname || 'Unknown';

    if (!refno) {
      showToast('Cannot add player without Reference No');
      return false;
    }

    setInvalidPassportList(prev => {
      if (prev.some(p => String(p.refno) === String(refno))) {
        showToast(`Player ${playerName} is already in Invalid Passport list`);
        return prev;
      }
      showToast(`Added ${playerName} to Invalid Passport list`);
      return [...prev, { refno, firstname, email, playerName }];
    });
    return true;
  };

  const addToNoPassport = (player) => {
    const refno = player.refno || player.ReferenceNo || player.RegistrationNo || player.ID || player.Id;
    const firstname = player.firstname || player.FirstName || player.PlayerName || player.Name || '';
    const email = player.email || player.Email || '';
    const playerName = player.playerName || `${player.FirstName || ''} ${player.Surname || ''}`.trim() || firstname || 'Unknown';

    if (!refno) {
      showToast('Cannot add player without Reference No');
      return false;
    }

    setNoPassportList(prev => {
      if (prev.some(p => String(p.refno) === String(refno))) {
        showToast(`Player ${playerName} is already in No Passport list`);
        return prev;
      }
      showToast(`Added ${playerName} to No Passport list`);
      return [...prev, { refno, firstname, email, playerName }];
    });
    return true;
  };

  const removeFromInvalidPassport = (refno) => {
    setInvalidPassportList(prev => prev.filter(p => String(p.refno) !== String(refno)));
  };

  const removeFromNoPassport = (refno) => {
    setNoPassportList(prev => prev.filter(p => String(p.refno) !== String(refno)));
  };

  const clearInvalidPassport = () => {
    setInvalidPassportList([]);
  };

  const clearNoPassport = () => {
    setNoPassportList([]);
  };

  return (
    <MailContext.Provider
      value={{
        invalidPassportList,
        noPassportList,
        addToInvalidPassport,
        addToNoPassport,
        removeFromInvalidPassport,
        removeFromNoPassport,
        clearInvalidPassport,
        clearNoPassport,
        toastMessage,
        showToast
      }}
    >
      {children}
    </MailContext.Provider>
  );
};

export const useMail = () => {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
};
