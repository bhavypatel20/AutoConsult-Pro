"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, X } from "lucide-react";

interface Car {
  id: string;
  brand: string;
  model: string;
  registrationNum: string;
  status?: string;
}

interface SearchableCarSelectProps {
  cars: Car[];
  name?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  onChange?: (carId: string) => void;
  showClear?: boolean;
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  paddingRight: '40px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-main)',
  outline: 'none',
  fontSize: '0.95rem',
  marginTop: '8px'
};

const dropdownStyle = {
  position: 'absolute' as const,
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 100,
  maxHeight: '240px',
  overflowY: 'auto' as const,
  background: 'var(--bg-surface)',
  backdropFilter: 'blur(20px)',
  border: '1px solid var(--border-light)',
  borderRadius: '12px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
  marginTop: '4px',
  padding: '6px'
};

const optionStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background 0.2s ease, color 0.2s ease',
  fontSize: '0.9rem',
  color: 'var(--text-main)'
};

export default function SearchableCarSelect({
  cars,
  name = "carId",
  required = false,
  placeholder = "Select a vehicle...",
  defaultValue = "",
  onChange,
  showClear = false
}: SearchableCarSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with defaultValue when cars or defaultValue change
  useEffect(() => {
    const found = cars.find((c) => c.id === defaultValue);
    if (found) {
      setSelectedCar(found);
      setSearchQuery(`${found.brand} ${found.model} - ${found.registrationNum}`);
    } else {
      setSelectedCar(null);
      setSearchQuery("");
    }
  }, [defaultValue, cars]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query text to show selected car description or empty
        if (selectedCar) {
          setSearchQuery(`${selectedCar.brand} ${selectedCar.model} - ${selectedCar.registrationNum}`);
        } else {
          setSearchQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedCar]);

  // If the query text is exactly the selected car description, filter with empty string to show all options
  const isQueryingSelected = selectedCar && searchQuery === `${selectedCar.brand} ${selectedCar.model} - ${selectedCar.registrationNum}`;
  const filterQuery = isQueryingSelected ? "" : searchQuery;

  const filteredCars = cars.filter((car) => {
    const brand = car.brand.toLowerCase();
    const model = car.model.toLowerCase();
    const reg = car.registrationNum.toLowerCase();
    const query = filterQuery.toLowerCase();

    return brand.includes(query) || model.includes(query) || reg.includes(query);
  });

  const handleSelect = (car: Car) => {
    setSelectedCar(car);
    setSearchQuery(`${car.brand} ${car.model} - ${car.registrationNum}`);
    setIsOpen(false);
    if (onChange) {
      onChange(car.id);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCar(null);
    setSearchQuery("");
    setIsOpen(false);
    if (onChange) {
      onChange("");
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Visual Search input */}
      <div style={{ position: "relative", width: "100%" }}>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            // If text is cleared completely, trigger selection clear
            if (!e.target.value) {
              setSelectedCar(null);
              if (onChange) onChange("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          style={inputStyle}
        />
        
        {/* Dropdown controls (clear / chevron) */}
        <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
          {selectedCar && (showClear || !required) && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
              title="Clear selection"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={18}
            style={{
              color: "var(--text-muted)",
              transform: isOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s ease",
              pointerEvents: "none"
            }}
          />
        </div>
      </div>

      {/* Hidden visual input for HTML5 required verification */}
      <input
        type="text"
        name={name}
        required={required}
        value={selectedCar?.id || ""}
        onChange={() => {}}
        tabIndex={-1}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          border: "none",
          padding: 0,
          bottom: 0,
          left: "50%"
        }}
      />

      {/* Dropdown Overlay */}
      {isOpen && (
        <div style={dropdownStyle}>
          {filteredCars.length === 0 ? (
            <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
              No matching cars found
            </div>
          ) : (
            filteredCars.map((car, idx) => {
              const isHovered = hoveredIndex === idx;
              const isSelected = selectedCar?.id === car.id;
              
              return (
                <div
                  key={car.id}
                  onClick={() => handleSelect(car)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    ...optionStyle,
                    background: isSelected 
                      ? "rgba(6, 182, 212, 0.15)" 
                      : isHovered 
                      ? "rgba(255, 255, 255, 0.05)" 
                      : "transparent",
                    color: isSelected ? "var(--primary)" : "var(--text-main)",
                    fontWeight: isSelected ? 600 : 400
                  }}
                >
                  <div style={{ fontWeight: 600 }}>
                    {car.brand} {car.model}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {car.registrationNum} {car.status ? `• ${car.status}` : ""}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
