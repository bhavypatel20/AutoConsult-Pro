"use client";
 
import { addCar } from "@/actions/car";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AutoLoader from "@/components/AutoLoader";
import { CAR_DATA, GENERIC_VARIANTS } from "@/lib/carData";

export default function AddCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedFuelType, setSelectedFuelType] = useState("Petrol");
  const [cngFitting, setCngFitting] = useState("Company Fitted");
  const [registrationNum, setRegistrationNum] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");

  // Get variants for the selected brand and model
  let modelVariants: string[] = [];
  if (selectedBrand && selectedBrand !== "Other" && selectedModel && selectedModel !== "Other") {
    if (CAR_DATA[selectedBrand]?.[selectedModel]) {
      modelVariants = CAR_DATA[selectedBrand][selectedModel];
    }
  }
  const variantOptions = modelVariants.length > 0 ? modelVariants : GENERIC_VARIANTS;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      
      // Brand
      const brandSel = formData.get("brandSelect") as string;
      if (brandSel === "Other") {
        formData.set("brand", formData.get("customBrand") as string);
      } else {
        formData.set("brand", brandSel);
      }

      // Model
      const modelSel = formData.get("modelSelect") as string;
      if (modelSel === "Other") {
        formData.set("model", formData.get("customModel") as string);
      } else if (modelSel) {
        formData.set("model", modelSel);
      } else {
        formData.set("model", formData.get("customModel") as string);
      }

      // Variant
      const variantSel = formData.get("variantSelect") as string;
      if (variantSel === "Other") {
        formData.set("variant", formData.get("customVariant") as string);
      } else {
        formData.set("variant", variantSel);
      }
      
      // Clean up temporary form inputs
      formData.delete("brandSelect");
      formData.delete("customBrand");
      formData.delete("modelSelect");
      formData.delete("customModel");
      formData.delete("variantSelect");
      formData.delete("customVariant");

      // If CNG or Petrol+CNG is selected, combine with fitting type
      const fuel = formData.get("fuelType") as string;
      if (fuel === "CNG" || fuel === "Petrol+CNG") {
        formData.set("fuelType", `${fuel} (${cngFitting})`);
      }

      const res = await addCar(formData);
      if (res && res.success) {
        router.push("/dashboard/inventory");
      } else {
        alert("Failed to save vehicle. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Add vehicle error:", err);
      alert(err.message || "An error occurred while saving the vehicle. Please check your internet connection or try again.");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-light)',
    color: 'var(--text-main)',
    marginTop: '8px',
    outline: 'none'
  };

  return (
    <div>
      <h2 style={{ marginBottom: '32px' }}>Add New Vehicle</h2>
      
      <form onSubmit={handleSubmit} className="glass-card" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div className="responsive-grid-2">
          <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span>Brand / Company</span>
            <select
              name="brandSelect"
              required
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedModel("");
                setSelectedVariant("");
              }}
              style={{...inputStyle, WebkitAppearance: 'none'}}
            >
              <option value="" disabled>Select brand...</option>
              {Object.keys(CAR_DATA).map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
              <option value="Other">Other / Custom Brand</option>
            </select>
          </label>

          {selectedBrand && selectedBrand !== "Other" ? (
            <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span>Model</span>
              <select
                name="modelSelect"
                required
                value={selectedModel}
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setSelectedVariant("");
                }}
                style={{...inputStyle, WebkitAppearance: 'none'}}
              >
                <option value="" disabled>Select model...</option>
                {Object.keys(CAR_DATA[selectedBrand]).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
                <option value="Other">Other / Custom Model</option>
              </select>
            </label>
          ) : (
            selectedBrand === "Other" ? (
              <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span>Custom Brand Name</span>
                <input
                  type="text"
                  name="customBrand"
                  required
                  style={inputStyle}
                  placeholder="e.g. Fiat"
                />
              </label>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span>Model</span>
                <select disabled style={{...inputStyle, WebkitAppearance: 'none'}}>
                  <option value="">Select brand first...</option>
                </select>
              </label>
            )
          )}
        </div>

        {((selectedBrand === "Other") || (selectedModel === "Other")) && (
          <div className="responsive-grid-2">
            {selectedBrand === "Other" ? (
              <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span>Custom Model Name</span>
                <input
                  type="text"
                  name="customModel"
                  required
                  style={inputStyle}
                  placeholder="e.g. Linea"
                />
              </label>
            ) : (
              selectedModel === "Other" && (
                <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span>Custom Model Name</span>
                  <input
                    type="text"
                    name="customModel"
                    required
                    style={inputStyle}
                    placeholder="e.g. Venue Facelift"
                  />
                </label>
              )
            )}
            <div></div>
          </div>
        )}

        <div className="responsive-grid-2">
          <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span>Variant / Sub-model</span>
            <select
              name="variantSelect"
              required
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              style={{...inputStyle, WebkitAppearance: 'none'}}
            >
              <option value="" disabled>Select variant...</option>
              {variantOptions.map((variant) => (
                <option key={variant} value={variant}>{variant}</option>
              ))}
              <option value="Other">Other / Custom Variant</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span>Owner Type</span>
            <select name="ownerType" required style={{...inputStyle, WebkitAppearance: 'none'}}>
              <option value="1st Owner">1st Owner</option>
              <option value="2nd Owner">2nd Owner</option>
              <option value="3rd Owner">3rd Owner</option>
              <option value="4th Owner">4th Owner</option>
              <option value="5th+ Owner">5th+ Owner</option>
            </select>
          </label>
        </div>

        {selectedVariant === "Other" && (
          <div className="responsive-grid-2">
            <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span>Custom Variant Name</span>
              <input
                type="text"
                name="customVariant"
                required
                style={inputStyle}
                placeholder="e.g. SX Plus CNG"
              />
            </label>
            <div></div>
          </div>
        )}

        <div className="responsive-grid-3">
          <label>Year <input type="number" name="year" required style={inputStyle} /></label>
          <label>Fuel Type 
            <select 
              name="fuelType" 
              required 
              style={{...inputStyle, WebkitAppearance: 'none'}} 
              value={selectedFuelType} 
              onChange={(e) => setSelectedFuelType(e.target.value)}
            >
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="CNG">CNG</option>
              <option value="Petrol+CNG">Petrol+CNG</option>
              <option value="Electric">Electric</option>
            </select>
          </label>
          <label>KM Driven <input type="number" name="kmDriven" required style={inputStyle} /></label>
        </div>

        {(selectedFuelType === "CNG" || selectedFuelType === "Petrol+CNG") && (
          <div className="responsive-grid-2">
            <label>CNG Fitting
              <select 
                value={cngFitting} 
                onChange={(e) => setCngFitting(e.target.value)} 
                style={{...inputStyle, WebkitAppearance: 'none'}}
              >
                <option value="Company Fitted">Company Fitted</option>
                <option value="Not Company Fitted">Not Company Fitted</option>
              </select>
            </label>
            <div></div> {/* Empty div to balance the layout */}
          </div>
        )}

        <div className="responsive-grid-2">
          <label>Registration Number 
            <input 
              name="registrationNum" 
              required 
              value={registrationNum}
              onChange={(e) => setRegistrationNum(e.target.value.toUpperCase())}
              style={{ ...inputStyle, textTransform: 'uppercase' }} 
              placeholder="MH 02 XX 1234" 
            />
          </label>
          <label>Status
            <select name="status" required style={{...inputStyle, WebkitAppearance: 'none'}}>
              <option value="Available">Available</option>
              <option value="Booked">Booked</option>
              <option value="Sold">Sold</option>
            </select>
          </label>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />

        <div className="responsive-grid-2">
          <label>Seller Name <input name="sellerName" style={inputStyle} placeholder="e.g. John Doe" /></label>
          <label>Seller Address <input name="sellerAddress" style={inputStyle} placeholder="e.g. 123 Main St, Mumbai" /></label>
        </div>

        <label style={{ display: 'block' }}>Primary Vehicle Photo
           <input type="file" name="image" accept="image/*" style={inputStyle} />
           <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Optional primary image for the dashboard</div>
        </label>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />

        <div className="responsive-grid-2">
          <label>Purchase Date
            <input 
              type="date" 
              name="purchaseDate" 
              required 
              style={inputStyle} 
              defaultValue={new Date().toISOString().split('T')[0]} 
            />
          </label>
          <label>Amount Paid to Seller (₹) 
            <input 
              type="number" 
              name="paidAmount" 
              placeholder="Leave blank if fully paid" 
              style={inputStyle} 
            />
          </label>
        </div>

        <div className="responsive-grid-2">
          <label>Purchase Price (₹) <input type="number" name="purchasePrice" required style={inputStyle} /></label>
          <label>Expected Sell Price (₹) <input type="number" name="expectedSellPrice" required style={inputStyle} /></label>
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '16px' }}>
          {loading ? "Saving..." : "Save Vehicle"}
        </button>
      </form>
      {loading && <AutoLoader fullscreen={true} message="Saving vehicle specs to inventory garage..." />}
    </div>
  );
}

