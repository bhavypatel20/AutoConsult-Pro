"use client";

import { useState } from "react";
import { uploadCarImage } from "@/actions/car";
import { ImagePlus, Loader2 } from "lucide-react";
import AutoLoader from "@/components/AutoLoader";

export default function PhotoUploader({ carId, existingImagesStr }: { carId: string, existingImagesStr: string | null }) {
  const [uploading, setUploading] = useState(false);
  
  const images = existingImagesStr ? existingImagesStr.split(',').filter(i => i) : [];

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData(e.currentTarget);
      await uploadCarImage(formData);
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Existing Photo Gallery */}
      {images.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {images.map((imgUrl, idx) => (
            <div key={idx} style={{ borderRadius: '12px', overflow: 'hidden', height: '150px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)' }}>
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={imgUrl} alt={`Car Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-light)', marginBottom: '24px' }}>
          No photos uploaded yet.
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleUpload} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
        <input type="hidden" name="carId" value={carId} />
        
        <input 
          type="file" 
          name="file" 
          required
          accept="image/*"
          style={{ flex: 1, color: 'var(--text-main)' }} 
        />
        
        <button type="submit" disabled={uploading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </form>

      {uploading && <AutoLoader fullscreen={true} message="Uploading vehicle snapshot to database garage..." />}
    </div>
  );
}
