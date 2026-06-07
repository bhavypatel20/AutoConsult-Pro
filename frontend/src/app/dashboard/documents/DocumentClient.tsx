"use client";

import { uploadCarDocument } from "@/actions/documents";
import { FileText, Link as LinkIcon, CheckCircle2, AlertCircle, Download, Upload, Eye } from "lucide-react";
import { useState } from "react";
import { compressImage } from "@/lib/image";

export default function DocumentsHubClient({ cars, role }: { cars: any[]; role?: string }) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const isReadOnly = role === "PARTNER_VIEW";

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>, carId: string) => {
    e.preventDefault();
    setUploadingId(carId);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        if (file.type.startsWith("image/")) {
          const compressedBase64 = await compressImage(file);
          formData.set("file", compressedBase64);
        } else {
          // If it's a PDF, verify size is within Vercel's 4.5MB limit
          if (file.size > 4 * 1024 * 1024) {
            alert("File is too large. Maximum size allowed is 4MB.");
            setUploadingId(null);
            return;
          }
        }
      } else {
        alert("Please select a file to upload.");
        setUploadingId(null);
        return;
      }
      
      const res = await uploadCarDocument(formData);
      if (res && !res.success) {
        alert(res.error || "Error uploading file");
      }
    } catch (err: any) {
      alert(err.message || "Error uploading file");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2>Document Upload Center</h2>
        <p style={{ color: 'var(--text-muted)' }}>Upload and download RC, Insurance, PUC, and Deal PDFs securely.</p>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Vehicle</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>File Upload / Download</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => {
              const hasDocs = !!car.documents;
              
              return (
              <tr key={car.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <strong>{car.brand} {car.model}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{car.registrationNum}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {hasDocs ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                      <CheckCircle2 size={16}/> Saved
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                      <AlertCircle size={16}/> Required
                    </span>
                  )}
                </td>
                <td style={{ padding: '16px 24px' }}>
                  
                  {hasDocs ? (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <a href={car.documents} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)', textDecoration: 'none', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                          <Eye size={16}/> View File
                        </a>
                        <a href={car.documents} download className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', textDecoration: 'none', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <Download size={16}/> Download
                        </a>
                        
                        {!isReadOnly && (
                          <form onSubmit={(e) => handleUpload(e, car.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="hidden" name="carId" value={car.id} />
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <input type="file" name="file" required style={{ display: 'none' }} onChange={(e) => e.target.form?.requestSubmit()} />
                              <span style={{ textDecoration: 'underline' }}>Upload Replacement</span>
                            </label>
                          </form>
                        )}
                     </div>
                  ) : isReadOnly ? (
                     <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Read-only permissions</span>
                  ) : (
                     <form onSubmit={(e) => handleUpload(e, car.id)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="hidden" name="carId" value={car.id} />
                        <input 
                          type="file" 
                          name="file" 
                          required
                          accept="image/*,.pdf"
                          style={{ 
                            flex: 1, padding: '8px 12px', borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', 
                            color: 'var(--text-main)', outline: 'none' 
                          }} 
                        />
                        <button type="submit" disabled={uploadingId === car.id} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
                          <Upload size={16}/> {uploadingId === car.id ? 'Uploading...' : 'Upload'}
                        </button>
                      </form>
                  )}

                </td>
              </tr>
            )})}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
