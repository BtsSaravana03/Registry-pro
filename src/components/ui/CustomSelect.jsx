import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './CustomSelect.module.css';

const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} className={styles.container} style={style}>
      <div 
        className={styles.selectTrigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.leftSection}>
          {Icon && <Icon size={16} className={styles.selectIcon} />}
          {selectedOption.color && (
            <div className={styles.colorDot} style={{ background: selectedOption.color }}></div>
          )}
          <span className={`${styles.selectedText} ${selectedOption.value ? styles.selectedTextActive : styles.selectedTextMuted}`}>
            {selectedOption.label || placeholder}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`${styles.chevronIcon} ${isOpen ? styles.chevronOpen : styles.chevronClosed}`} 
        />
      </div>

      {isOpen && (
        <div className={`card glass ${styles.dropdownBox}`}>
          {options.map((option) => (
            <div
              key={option.value}
              className={`${styles.optionItem} ${value === option.value ? styles.optionActive : styles.optionInactive}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <div className={styles.optionLabelContainer}>
                {option.color && (
                  <div className={styles.colorDot} style={{ background: option.color }}></div>
                )}
                {option.label}
              </div>
              {value === option.value && <Check size={16} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
