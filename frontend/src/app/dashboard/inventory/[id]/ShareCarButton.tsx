"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareCarButtonProps {
  car: {
    brand: string;
    model: string;
    year: number;
    fuelType: string;
    kmDriven: number;
    registrationNum: string;
    expectedSellPrice: number;
  };
}

export default function ShareCarButton({ car }: ShareCarButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const message = `🚗 *Vehicle for Sale: ${car.year} ${car.brand} ${car.model}*
----------------------------------
⛽ *Fuel Type:* ${car.fuelType}
🛣️ *KM Driven:* ${car.kmDriven.toLocaleString()} km
🎫 *Reg Number:* ${car.registrationNum}
💰 *Expected Price:* ₹ ${car.expectedSellPrice.toLocaleString()}
----------------------------------
_Interested? Let's connect!_`;

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy specs: ", err);
    }
  };

  return (
    <button 
      onClick={handleCopy} 
      className="btn-primary" 
      style={{ 
        padding: '8px 16px', 
        background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(168, 85, 247, 0.2)', 
        color: copied ? '#10b981' : '#c084fc', 
        border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
        boxShadow: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      {copied ? (
        <>
          <Check size={14} /> Copied!
        </>
      ) : (
        <>
          <Share2 size={14} /> Share Specs
        </>
      )}
    </button>
  );
}
