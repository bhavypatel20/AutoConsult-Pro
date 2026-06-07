"use client";

import { updateCar } from "@/actions/car";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FormSubmitButton from "@/components/FormSubmitButton";
import { CAR_DATA, GENERIC_VARIANTS } from "@/lib/carData";
import { compressImage } from "@/lib/image";
import AutoLoader from "@/components/AutoLoader";

interface EditCarFormProps {
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    fuelType: string;
    kmDriven: number;
    registrationNum: string;
    status: string;
    sellerName: string | null;
    sellerAddress: string | null;
    purchasePrice: number;
    expectedSellPrice: number;
    createdAt: string | Date;
    ownerType: string | null;
    variant: string | null;
  };
}

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

export default function EditCarForm({ car }: EditCarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Saving vehicle specs updates...");

  // Parse initial fuel type and fitting
  let initialBaseFuel = "Petrol";
  let initialFitting = "Company Fitted";

  if (car.fuelType) {
    if (car.fuelType.includes("Petrol+CNG")) {
      initialBaseFuel = "Petrol+CNG";
    } else if (car.fuelType.includes("CNG")) {
      initialBaseFuel = "CNG";
    } else if (car.fuelType.includes("Diesel")) {
      initialBaseFuel = "Diesel";
    } else if (car.fuelType.includes("Electric")) {
      initialBaseFuel = "Electric";
    } else if (car.fuelType.includes("Petrol")) {
      initialBaseFuel = "Petrol";
    }

    if (car.fuelType.includes("Not Company Fitted")) {
      initialFitting = "Not Company Fitted";
    } else if (car.fuelType.includes("Company Fitted")) {
      initialFitting = "Company Fitted";
    }
  }

  const [fuelType, setFuelType] = useState(initialBaseFuel);
  const [cngFitting, setCngFitting] = useState(initialFitting);
  const [registrationNum, setRegistrationNum] = useState(car.registrationNum);

  // Check if existing car brand is in CAR_DATA
  const isBrandInList = car.brand in CAR_DATA;
  const initialBrand = isBrandInList ? car.brand : (car.brand ? "Other" : "");
  const initialCustomBrand = isBrandInList ? "" : car.brand;

  let isModelInList = false;
  if (isBrandInList) {
    isModelInList = car.model in CAR_DATA[car.brand];
  }
  const initialModel = isModelInList ? car.model : (car.model ? "Other" : "");
  const initialCustomModel = isModelInList ? "" : car.model;

  // Check if existing car variant is in the model's variants list, or fallback to generic
  let isVariantInList = false;
  let modelVariants: string[] = [];
  if (isBrandInList && isModelInList) {
    modelVariants = CAR_DATA[car.brand][car.model] || [];
    isVariantInList = modelVariants.includes(car.variant || "");
  } else {
    isVariantInList = GENERIC_VARIANTS.includes(car.variant || "");
  }

  const initialVariant = isVariantInList ? (car.variant || "") : (car.variant ? "Other" : "");
  const initialCustomVariant = isVariantInList ? "" : (car.variant || "");

  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [customBrand, setCustomBrand] = useState(initialCustomBrand);
  const [customModel, setCustomModel] = useState(initialCustomModel);
  const [customVariant, setCustomVariant] = useState(initialCustomVariant);

  // Get variants for the selected brand and model dynamically
  let activeModelVariants: string[] = [];
  if (selectedBrand && selectedBrand !== "Other" && selectedModel && selectedModel !== "Other") {
    if (CAR_DATA[selectedBrand]?.[selectedModel]) {
      activeModelVariants = CAR_DATA[selectedBrand][selectedModel];
    }
  }
  const variantOptions = activeModelVariants.length > 0 ? activeModelVariants : GENERIC_VARIANTS;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setLoadingMessage("Preparing vehicle modifications...");
    try {
      const formData = new FormData(e.currentTarget);

      // Compress image client-side if uploaded
      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        setLoadingMessage("Compressing vehicle photo for fast update...");
        const compressedBase64 = await compressImage(imageFile);
        formData.set("image", compressedBase64);
      } else {
        formData.delete("image");
      }

      setLoadingMessage("Tuning vehicle profile updates...");

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

      const fuel = formData.get("fuelType") as string;
      if (fuel === "CNG" || fuel === "Petrol+CNG") {
        formData.set("fuelType", `${fuel} (${cngFitting})`);
      }

      const res = await updateCar(formData);
      if (res && res.success) {
        router.push(`/dashboard/inventory/${car.id}`);
      } else {
        alert(res?.error || "Failed to save changes.");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Edit vehicle error:", err);
      alert(err.message || "An error occurred while saving the vehicle. Please check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <input type="hidden" name="id" value={car.id} />
      
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
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
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
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
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
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
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
          <select name="ownerType" required defaultValue={car.ownerType || "1st Owner"} style={{...inputStyle, WebkitAppearance: 'none'}}>
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
              value={customVariant}
              onChange={(e) => setCustomVariant(e.target.value)}
              style={inputStyle}
              placeholder="e.g. SX Plus CNG"
            />
          </label>
          <div></div>
        </div>
      )}

      <div className="responsive-grid-3">
        <label>Year <input type="number" name="year" required defaultValue={car.year} style={inputStyle} /></label>
        <label>Fuel Type
          <select name="fuelType" required value={fuelType} onChange={(e) => setFuelType(e.target.value)} style={{...inputStyle, WebkitAppearance: 'none'}}>
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="CNG">CNG</option>
            <option value="Petrol+CNG">Petrol+CNG</option>
            <option value="Electric">Electric</option>
          </select>
        </label>
        <label>Status
          <select name="status" required defaultValue={car.status} style={{...inputStyle, WebkitAppearance: 'none'}}>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="In Service">In Service</option>
          </select>
        </label>
      </div>

      {(fuelType === "CNG" || fuelType === "Petrol+CNG") && (
        <div className="responsive-grid-2">
          <label>CNG Fitting
            <select value={cngFitting} onChange={(e) => setCngFitting(e.target.value)} style={{...inputStyle, WebkitAppearance: 'none'}}>
              <option value="Company Fitted">Company Fitted</option>
              <option value="Not Company Fitted">Not Company Fitted</option>
            </select>
          </label>
          <div></div>
        </div>
      )}

      <div className="responsive-grid-2">
        <label>KM Driven <input type="number" name="kmDriven" required defaultValue={car.kmDriven} style={inputStyle} /></label>
        <label>Registration Number 
          <input 
            name="registrationNum" 
            required 
            value={registrationNum} 
            onChange={(e) => setRegistrationNum(e.target.value.toUpperCase())}
            style={{ ...inputStyle, textTransform: 'uppercase' }} 
          />
        </label>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '12px 0' }} />

      <div className="responsive-grid-2">
        <label>Seller Name <input name="sellerName" defaultValue={car.sellerName || ""} style={inputStyle} placeholder="e.g. John Doe" /></label>
        <label>Seller Address <input name="sellerAddress" defaultValue={car.sellerAddress || ""} style={inputStyle} placeholder="e.g. 123 Main St, Mumbai" /></label>
      </div>
      
      <label style={{ display: 'block' }}>Replace Vehicle Photo (Optional)
         <input type="file" name="image" accept="image/*" style={inputStyle} />
         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Leave blank to keep the existing photo</div>
      </label>

      <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <h4 style={{ marginBottom: '16px' }}>Financials & Dates</h4>
        <div className="responsive-grid-3">
          <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span>Purchase Date</span>
            <input 
              type="date" 
              name="purchaseDate" 
              required 
              defaultValue={new Date(car.createdAt).toISOString().split('T')[0]} 
              style={inputStyle} 
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span>Original Purchase Price (₹)</span>
            <input type="number" name="purchasePrice" required defaultValue={car.purchasePrice} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span>Expected Selling Price (₹)</span>
            <input type="number" name="expectedSellPrice" required defaultValue={car.expectedSellPrice} style={inputStyle} />
          </label>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="btn-primary" 
        style={{ alignSelf: 'flex-start', marginTop: '16px' }}
      >
        {loading ? "Saving..." : "Save Changes"}
      </button>
      {loading && <AutoLoader fullscreen={true} message={loadingMessage} />}
    </form>
  );
}
