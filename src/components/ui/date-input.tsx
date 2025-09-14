import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from './input';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className = "",
  disabled = false,
  required = false,
  name
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [showNativePicker, setShowNativePicker] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Convert yyyy-mm-dd to dd/mm/yyyy for display
  const formatDisplayDate = (isoDate: string): string => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  // Convert dd/mm/yyyy to yyyy-mm-dd for storage
  const parseDisplayDate = (displayDate: string): string => {
    if (!displayDate) return '';
    const parts = displayDate.split('/');
    if (parts.length !== 3) return '';
    const [day, month, year] = parts;
    if (!day || !month || !year) return '';
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(formatDisplayDate(value));
  }, [value]);

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Auto-format as user types: add slashes automatically
    inputValue = inputValue.replace(/\D/g, ''); // Remove non-digits
    if (inputValue.length >= 2) {
      inputValue = inputValue.slice(0, 2) + '/' + inputValue.slice(2);
    }
    if (inputValue.length >= 5) {
      inputValue = inputValue.slice(0, 5) + '/' + inputValue.slice(5, 9);
    }

    setDisplayValue(inputValue);

    // If complete date, convert to ISO and update parent
    if (inputValue.length === 10) {
      const isoDate = parseDisplayDate(inputValue);
      if (isoDate) {
        onChange(isoDate);
      }
    } else if (inputValue.length === 0) {
      onChange('');
    }
  };

  const handleCalendarClick = () => {
    if (!disabled && hiddenInputRef.current) {
      hiddenInputRef.current.showPicker();
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoValue = e.target.value;
    onChange(isoValue);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          value={displayValue}
          onChange={handleDisplayChange}
          placeholder={placeholder}
          className={`${className} pr-10`}
          disabled={disabled}
          required={required}
          name={name}
          maxLength={10}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          disabled={disabled}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          tabIndex={-1}
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {/* Hidden native date input for picker functionality */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value}
        onChange={handleNativeChange}
        className="absolute opacity-0 pointer-events-none"
        tabIndex={-1}
        disabled={disabled}
      />
    </div>
  );
};