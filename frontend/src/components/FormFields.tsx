import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react';
import { createPortal } from 'react-dom';

type FieldInputProps = InputHTMLAttributes<HTMLInputElement>;

export function FieldInput({ className = '', ...props }: FieldInputProps) {
  return <input {...props} className={`field-input ${className}`.trim()} />;
}

type FieldNumberProps = Omit<FieldInputProps, 'onChange' | 'value' | 'defaultValue'> & {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
};

export function FieldNumber({
  className = '',
  min,
  max,
  step = 1,
  onChange,
  value,
  defaultValue,
  ...props
}: FieldNumberProps) {
  const numericValue = Number(value ?? defaultValue);
  const increment = Number(step) || 1;
  const minimum = min === undefined ? undefined : Number(min);
  const maximum = max === undefined ? undefined : Number(max);

  function changeBy(direction: -1 | 1) {
    const base = Number.isFinite(numericValue)
      ? numericValue
      : minimum ?? 0;
    const next = Number((base + direction * increment).toFixed(10));
    const bounded = Math.min(maximum ?? Infinity, Math.max(minimum ?? -Infinity, next));
    onChange?.(String(bounded));
  }

  return (
    <div className="number-field">
      <FieldInput
        {...props}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => onChange?.(event.target.value)}
        className={`number-field-input ${className}`.trim()}
      />
      <div className="number-field-actions" aria-label="Adjust value">
        <button
          type="button"
          className="number-field-action"
          aria-label="Decrease value"
          disabled={props.disabled || (Number.isFinite(numericValue) && minimum !== undefined && numericValue <= minimum)}
          onClick={() => changeBy(-1)}
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          className="number-field-action"
          aria-label="Increase value"
          disabled={props.disabled || (Number.isFinite(numericValue) && maximum !== undefined && numericValue >= maximum)}
          onClick={() => changeBy(1)}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

interface FieldSelectOption {
  value: string;
  label: string;
}

interface FieldSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FieldSelectOption[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;
  'aria-label'?: string;
}

export function FieldSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  style,
  disabled = false,
  required = false,
  'aria-label': ariaLabel,
}: FieldSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  function openAt(index: number) {
    setActiveIndex(index < 0 ? 0 : Math.min(index, options.length - 1));
    setOpen(true);
  }

  function choose(option: FieldSelectOption) {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openAt(open ? (activeIndex + 1) % options.length : selectedIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(open ? (activeIndex - 1 + options.length) % options.length : selectedIndex);
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    } else if ((event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault();
      openAt(selectedIndex);
    }
  }

  return (
    <div className="custom-select" ref={rootRef} style={style}>
      <button
        ref={triggerRef}
        type="button"
        className={`field-input custom-select-trigger ${className}`.trim()}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-required={required}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openAt(selectedIndex))}
        onKeyDown={handleKeyDown}
      >
        <span className={selected ? '' : 'custom-select-placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className={open ? 'custom-select-chevron is-open' : 'custom-select-chevron'} />
      </button>
      {open && (
        <div id={listboxId} className="custom-select-menu" role="listbox">
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => { optionRefs.current[index] = element; }}
              type="button"
              className={`custom-select-option${option.value === value ? ' is-selected' : ''}`}
              role="option"
              aria-selected={option.value === value}
              tabIndex={activeIndex === index ? 0 : -1}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
              onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  setOpen(false);
                  triggerRef.current?.focus();
                } else {
                  handleKeyDown(event);
                }
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FieldDateProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}

function parseDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDateValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function FieldDate({
  id,
  value,
  onChange,
  min,
  max,
  className = '',
  style,
  required = false,
  disabled = false,
  'aria-label': ariaLabel,
}: FieldDateProps) {
  
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dayRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const pendingFocusDate = useRef<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [calendarPosition, setCalendarPosition] = useState({
    top: 0,
    left: 0,
    ready: false,
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const calendarRect = calendarRef.current?.getBoundingClientRect();
      const calendarHeight = calendarRect?.height ?? 340;
      const calendarWidth = calendarRect?.width ?? 280;
      const gap = 6;

      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const placeAbove = spaceBelow < calendarHeight && spaceAbove > spaceBelow;
      const preferredTop = placeAbove
        ? rect.top - calendarHeight - gap
        : rect.bottom + gap;
      const top = Math.max(
        8,
        Math.min(preferredTop, window.innerHeight - calendarHeight - 8),
      );

      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - calendarWidth - 8),
      );

      setCalendarPosition({ top, left, ready: true });
    }

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const selectedDate = parseDate(value);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const current = selectedDate ?? new Date();
    return new Date(current.getFullYear(), current.getMonth(), 1);
  });
  const firstYear = Math.min(1900, visibleMonth.getFullYear());
  const lastYear = Math.max(currentYear + 10, visibleMonth.getFullYear());
  const years = Array.from(
    { length: lastYear - firstYear + 1 },
    (_, index) => lastYear - index,
  );
  const firstWeekday = (new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarDays = useMemo(
    () => Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
      const day = index - firstWeekday + 1;
      return day > 0 && day <= daysInMonth ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day) : null;
    }),
    [daysInMonth, firstWeekday, visibleMonth],
  );

  useEffect(() => {
    const dateToFocus = pendingFocusDate.current;
    if (dateToFocus) {
      dayRefs.current[dateToFocus]?.focus();
      pendingFocusDate.current = null;
    }
  }, [calendarDays]);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !rootRef.current?.contains(target) &&
        !calendarRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, []);

  const minimumDate = parseDate(min ?? '');
  const maximumDate = parseDate(max ?? '');

  return (
    <div className="custom-date" ref={rootRef} style={style}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`field-input custom-date-trigger ${className}`.trim()}
        aria-label={ariaLabel ?? 'Choose date'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
        disabled={disabled}
        onClick={() => {
          if (!open && selectedDate) {
            setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
          }
          if (!open) {
            setCalendarPosition((position) => ({ ...position, ready: false }));
          }
          setOpen(!open);
        }}
      >
        <span className={selectedDate ? '' : 'custom-date-placeholder'}>
          {selectedDate
            ? selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Select a date'}
        </span>
        <CalendarDays size={17} />
      </button>
      {open && createPortal (
        <div
          ref={calendarRef}
          className="custom-calendar"
          role="dialog"
          aria-label="Choose a date"
          style={{
            position: 'fixed',
            top: calendarPosition.top,
            left: calendarPosition.left,
            visibility: calendarPosition.ready ? 'visible' : 'hidden',
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div className="custom-calendar-header">
            <button
              type="button"
              className="calendar-nav"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
            >
              <ChevronLeft size={17} />
            </button>

            <div className="calendar-month-year">
              <FieldSelect
                className="calendar-month-select-trigger"
                style={{ flex: '1.3 1', width: 0 }}
                aria-label="Select month"
                value={String(visibleMonth.getMonth())}
                options={Array.from({ length: 12 }, (_, month) => ({
                  value: String(month),
                  label: new Date(2024, month, 1).toLocaleDateString('en-GB', {
                    month: 'long',
                  }),
                }))}
                onChange={(month) =>
                  setVisibleMonth(
                    new Date(
                      visibleMonth.getFullYear(),
                      Number(month),
                      1,
                    ),
                  )
                }
              />
              <FieldSelect
                className="calendar-year-select-trigger"
                style={{ flex: '0.8 1', width: 0 }}
                aria-label="Select year"
                value={String(visibleMonth.getFullYear())}
                options={years.map((year) => ({
                  value: String(year),
                  label: String(year),
                }))}
                onChange={(year) =>
                  setVisibleMonth(
                    new Date(
                      Number(year),
                      visibleMonth.getMonth(),
                      1,
                    ),
                  )
                }
              />
            </div>

            <button
              type="button"
              className="calendar-nav"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="calendar-grid calendar-weekdays" aria-hidden="true">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {calendarDays.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />;
              const dateValue = formatDateValue(date);
              const isSelected = dateValue === value;
              const todayValue = formatDateValue(new Date());
              const isToday = dateValue === todayValue;
              const outsideRange = (minimumDate && date < minimumDate) || (maximumDate && date > maximumDate);
              const selectedIsVisible = selectedDate
                && selectedDate.getFullYear() === visibleMonth.getFullYear()
                && selectedDate.getMonth() === visibleMonth.getMonth();
              const todayIsVisible = visibleMonth.getFullYear() === new Date().getFullYear()
                && visibleMonth.getMonth() === new Date().getMonth();
              const isTabStop = isSelected
                || (selectedDate
                  ? !selectedIsVisible && date.getDate() === 1
                  : isToday || (!todayIsVisible && date.getDate() === 1));
              return (
                <button
                  key={dateValue}
                  ref={(element) => { dayRefs.current[dateValue] = element; }}
                  type="button"
                  className={`calendar-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`}
                  aria-pressed={isSelected}
                  aria-label={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  tabIndex={isTabStop ? 0 : -1}
                  disabled={Boolean(outsideRange)}
                  onKeyDown={(event) => {
                    const offsets: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                    };
                    const offset = offsets[event.key];
                    if (offset !== undefined) {
                      event.preventDefault();
                      const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
                      const nextValue = formatDateValue(nextDate);
                      const sameMonth = nextDate.getMonth() === visibleMonth.getMonth()
                        && nextDate.getFullYear() === visibleMonth.getFullYear();
                      if (sameMonth) {
                        dayRefs.current[nextValue]?.focus();
                      } else {
                        pendingFocusDate.current = nextValue;
                        setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
                      }
                    }
                  }}
                  onClick={() => {
                    onChange(dateValue);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="custom-calendar-footer">
            {!required && (
              <button type="button" className="calendar-text-action" onClick={() => { onChange(''); setOpen(false); triggerRef.current?.focus(); }}>
                Clear
              </button>
            )}
            <button
              type="button"
              className="calendar-text-action"
              disabled={Boolean((minimumDate && new Date().setHours(0, 0, 0, 0) < minimumDate.getTime()) || (maximumDate && new Date().setHours(0, 0, 0, 0) > maximumDate.getTime()))}
              onClick={() => {
                const today = new Date();
                onChange(formatDateValue(today));
                setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              Today
            </button>
          </div>
        </div>, document.body
      )}
    </div>
  );
}

interface FieldCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  disabled?: boolean;
}

export function FieldCheckbox({ checked, onChange, children, disabled = false }: FieldCheckboxProps) {
  return (
    <label className={`custom-checkbox${disabled ? ' is-disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="custom-checkbox-box" aria-hidden="true">
        {checked && <Check size={13} strokeWidth={3} />}
      </span>
      <span>{children}</span>
    </label>
  );
}

type FieldTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function FieldTextarea({ className = '', ...props }: FieldTextareaProps) {
  return <textarea {...props} className={`field-input ${className}`.trim()} />;
}
