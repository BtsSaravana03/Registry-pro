import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './DatePicker.module.css';

const DatePicker = ({ value, onChange, placeholder = 'Select Date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState('days'); // 'days', 'months', 'years'
  const [viewDate, setViewDate] = useState(new Date());
  const [yearRangeStart, setYearRangeStart] = useState(Math.floor(new Date().getFullYear() / 12) * 12);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setViewMode('days');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const selectedDate = parseDate(value);

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrev = (e) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    } else if (viewMode === 'years') {
      setYearRangeStart(prev => prev - 12);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (viewMode === 'days') {
      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    } else if (viewMode === 'years') {
      setYearRangeStart(prev => prev + 12);
    }
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const handleMonthSelect = (monthIndex) => {
    setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
    setViewMode('days');
  };

  const handleYearSelect = (year) => {
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setViewMode('months');
  };

  const handleFilterMonth = (e) => {
    e.stopPropagation();
    const month = String(viewDate.getMonth() + 1).padStart(2, '0');
    const year = viewDate.getFullYear();
    onChange(`${year}-${month}`);
    setIsOpen(false);
  };

  const handleFilterYear = (e) => {
    e.stopPropagation();
    onChange(`${viewDate.getFullYear()}`);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setViewMode('days');
  };

  const getTriggerText = () => {
    if (!value) return placeholder;
    const parts = value.split('-');
    if (parts.length === 1) return `Year ${parts[0]}`;
    if (parts.length === 2) {
      const d = new Date(parts[0], parseInt(parts[1]) - 1);
      return d.toLocaleString('default', { month: 'short', year: 'numeric' });
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? placeholder : d.toLocaleDateString();
  };

  const renderDaysView = () => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = selectedDate && 
                        selectedDate.getDate() === d && 
                        selectedDate.getMonth() === month && 
                        selectedDate.getFullYear() === year;
      const isToday = new Date().getDate() === d && 
                      new Date().getMonth() === month && 
                      new Date().getFullYear() === year;

      days.push(
        <div 
          key={d} 
          className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
          onClick={() => handleDateSelect(d)}
        >
          {d}
        </div>
      );
    }

    return (
      <>
        <div className={styles.weekDays}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className={styles.weekDay}>{d}</div>)}
        </div>
        <div className={styles.daysGrid}>
          {days}
        </div>
      </>
    );
  };

  const renderMonthsView = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return (
      <div className={styles.monthsGrid}>
        {months.map((m, i) => (
          <div 
            key={m} 
            className={`${styles.gridItem} ${viewDate.getMonth() === i ? styles.activeItem : ''}`}
            onClick={() => handleMonthSelect(i)}
          >
            {m}
          </div>
        ))}
      </div>
    );
  };

  const renderYearsView = () => {
    const years = [];
    for (let i = 0; i < 12; i++) {
      years.push(yearRangeStart + i);
    }
    return (
      <div className={styles.yearsGrid}>
        {years.map(y => (
          <div 
            key={y} 
            className={`${styles.gridItem} ${viewDate.getFullYear() === y ? styles.activeItem : ''}`}
            onClick={() => handleYearSelect(y)}
          >
            {y}
          </div>
        ))}
      </div>
    );
  };

  const renderPopover = () => {
    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    return (
      <div className={`card glass ${styles.calendarPopover}`}>
        <div className={styles.calendarHeader}>
          {viewMode !== 'months' && (
            <button onClick={handlePrev} className={styles.navBtn}><ChevronLeft size={16} /></button>
          )}
          
          <div className={styles.monthYear}>
            <div className={styles.headerSelectors}>
              <button 
                className={`${styles.viewToggleBtn} ${viewMode === 'months' ? styles.activeToggle : ''}`}
                onClick={() => setViewMode(viewMode === 'months' ? 'days' : 'months')}
              >
                {monthName}
              </button>
              <button 
                className={`${styles.viewToggleBtn} ${viewMode === 'years' ? styles.activeToggle : ''}`}
                onClick={() => setViewMode(viewMode === 'years' ? 'days' : 'years')}
              >
                {year}
              </button>
            </div>
            
            {viewMode === 'days' && (
              <div className={styles.headerActions}>
                <button className={styles.actionBtn} onClick={handleFilterMonth}>Filter Month</button>
                <button className={styles.actionBtn} onClick={handleFilterYear}>Filter Year</button>
              </div>
            )}
          </div>

          {viewMode !== 'months' && (
            <button onClick={handleNext} className={styles.navBtn}><ChevronRight size={16} /></button>
          )}
        </div>

        <div className={styles.viewContainer}>
          {viewMode === 'days' && renderDaysView()}
          {viewMode === 'months' && renderMonthsView()}
          {viewMode === 'years' && renderYearsView()}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.datePickerContainer} ref={containerRef}>
      <div 
        className={`${styles.dateTrigger} ${value ? styles.hasValue : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon size={14} className={styles.icon} />
        <span className={styles.triggerText}>{getTriggerText()}</span>
        {value && (
          <button className={styles.clearBtn} onClick={handleClear}>
            <X size={12} />
          </button>
        )}
      </div>
      {isOpen && renderPopover()}
    </div>
  );
};

export default DatePicker;
