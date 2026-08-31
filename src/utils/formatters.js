export const isDateKey = (key) => {
  const label = String(key || '').toLowerCase();
  return label.includes('date') || label.includes('dob') || label.includes('created') || label.includes('updated') || label.includes('time');
};

export const formatValue = (val, key) => {
  if (val === undefined || val === null || val === '') return '-';
  
  if (isDateKey(key)) {
    try {
      const date = new Date(val);
      if (!isNaN(date.getTime()) && String(val).length > 5) {
        // Check if it's a zero-time date (e.g., T00:00:00 or similar)
        // We check the original string if possible, or check if UTC hours/mins are 0
        const isMidnight = String(val).includes('T00:00:00') || (date.getUTCHours() === 0 && date.getUTCMinutes() === 0);
        
        if (isMidnight) {
          // Format as Date Only
          return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }

        // Format as Date Time
        return date.toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (e) {
      return val;
    }
  }
  return val;
};
