"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ShieldCheck, Upload, CheckCircle2, AlertTriangle,
  Clock, XCircle, Loader2, FileText, Camera,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DOC_TYPES = [
  { value: "PASSPORT",         label: "Passport",         needsBack: false },
  { value: "NATIONAL_ID",      label: "National ID",      needsBack: true  },
  { value: "DRIVERS_LICENSE",  label: "Driver's License", needsBack: true  },
];

type KYCSubmission = {
  status: string;
  documentType: string;
  submittedAt: string;
  notes?: string | null;
};

async function uploadFile(file: File, userId: string, slot: string): Promise<string> {
  const ext  = file.name.split(".").pop();
  const path = `${userId}/${slot}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("kyc-documents")
    .upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("kyc-documents").getPublicUrl(path);
  return data.publicUrl;
}

function StatusBanner({ submission }: { submission: KYCSubmission }) {
  const map = {
    PENDING:  { icon: Clock,        color: "var(--gold)",  bg: "var(--gold-l)",  label: "Under Review",  desc: "We're reviewing your documents. This usually takes 1–2 business days." },
    APPROVED: { icon: CheckCircle2, color: "var(--green)", bg: "var(--green-l)", label: "Verified",      desc: "Your identity has been verified. You have full access to all features." },
    REJECTED: { icon: XCircle,      color: "var(--red)",   bg: "var(--red-l)",   label: "Rejected",      desc: submission.notes ?? "Your submission was rejected. Please resubmit with valid documents." },
  }[submission.status] ?? null;

  if (!map) return null;
  const Icon = map.icon;

  return (
    <div className="kyc-status-banner" style={{ background: map.bg, borderColor: map.color }}>
      <div className="kyc-status-icon" style={{ color: map.color }}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div>
        <p className="kyc-status-label" style={{ color: map.color }}>{map.label}</p>
        <p className="kyc-status-desc">{map.desc}</p>
      </div>
    </div>
  );
}

function FileSlot({
  label, hint, file, preview, onChange, disabled,
}: {
  label: string; hint: string;
  file: File | null; preview: string | null;
  onChange: (f: File) => void; disabled: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="kyc-slot" onClick={() => !disabled && ref.current?.click()}>
      <input
        ref={ref} type="file" accept="image/*,application/pdf"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }}
        disabled={disabled}
      />
      {preview ? (
        <img src={preview} alt={label} className="kyc-slot-preview" />
      ) : (
        <div className="kyc-slot-empty">
          <Upload size={20} strokeWidth={1.5} style={{ color: "var(--ink-faint)" }} />
          <span className="kyc-slot-label">{label}</span>
          <span className="kyc-slot-hint">{hint}</span>
        </div>
      )}
      {file && (
        <div className="kyc-slot-name">{file.name}</div>
      )}
    </div>
  );
}

export default function KYCPage() {
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [loading, setLoading]       = useState(true);
  const [docType, setDocType]       = useState("PASSPORT");
  const [frontFile, setFrontFile]   = useState<File | null>(null);
  const [backFile, setBackFile]     = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [frontPrev, setFrontPrev]   = useState<string | null>(null);
  const [backPrev, setBackPrev]     = useState<string | null>(null);
  const [selfiePrev, setSelfiePrev] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(false);

  const selectedDoc = DOC_TYPES.find((d) => d.value === docType)!;
  const canResubmit = submission?.status === "REJECTED" || !submission;
  const isLocked    = submission?.status === "PENDING" || submission?.status === "APPROVED";

  useEffect(() => {
    fetch("/api/kyc")
      .then((r) => r.json())
      .then((d) => { setSubmission(d.submission ?? null); setLoading(false); });
  }, []);

  const setFile = (slot: "front" | "back" | "selfie") => (file: File) => {
    const url = URL.createObjectURL(file);
    if (slot === "front")  { setFrontFile(file);  setFrontPrev(url); }
    if (slot === "back")   { setBackFile(file);   setBackPrev(url); }
    if (slot === "selfie") { setSelfieFile(file); setSelfiePrev(url); }
  };

  const handleSubmit = async () => {
    setError("");
    if (!frontFile || !selfieFile) { setError("Please upload all required documents."); return; }
    if (selectedDoc.needsBack && !backFile) { setError("Please upload the back of your document."); return; }

    setSubmitting(true);
    try {
      // Get userId from session — we'll pull it from the API response implicitly
      // by using the server-side session in the API route
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const userId = sessionData?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const [frontUrl, selfieUrl] = await Promise.all([
        uploadFile(frontFile, userId, "front"),
        uploadFile(selfieFile, userId, "selfie"),
      ]);
      const backUrl = backFile ? await uploadFile(backFile, userId, "back") : undefined;

      const res  = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType, frontUrl, backUrl, selfieUrl }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      setSuccess(true);
      setSubmission({ status: "PENDING", documentType: docType, submittedAt: new Date().toISOString() });
    } catch (e: any) {
      setError(e.message ?? "Upload failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .kyc-wrap {
          max-width: 680px; margin: 0 auto;
          padding: 16px 16px 80px;
          font-family: var(--sans);
        }
        .kyc-brand {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.18em; color: var(--accent);
          text-transform: uppercase; margin-bottom: 4px;
        }
        .kyc-title {
          font-size: 1.4rem; font-weight: 700; color: var(--ink);
          letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .kyc-sub {
          font-size: 0.7rem; color: var(--ink-faint);
          font-weight: 300; margin-bottom: 24px;
        }

        /* Status banner */
        .kyc-status-banner {
          display: flex; align-items: flex-start; gap: 14px;
          border: 1px solid; border-radius: 12px;
          padding: 16px 18px; margin-bottom: 24px;
        }
        .kyc-status-icon { flex-shrink: 0; margin-top: 1px; }
        .kyc-status-label {
          font-size: 0.82rem; font-weight: 700; margin-bottom: 3px;
        }
        .kyc-status-desc {
          font-size: 0.72rem; color: var(--ink-dim); line-height: 1.6;
        }

        /* Steps */
        .kyc-steps {
          display: flex; gap: 8px; margin-bottom: 24px;
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.08em; color: var(--ink-faint);
        }
        .kyc-step {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 20px;
          background: var(--surface); border: 1px solid var(--line-strong);
        }
        .kyc-step.active {
          background: rgba(56,189,248,0.1);
          border-color: var(--accent); color: var(--accent);
        }

        /* Card */
        .kyc-card {
          background: var(--card); border: 1px solid var(--line-strong);
          border-radius: 14px; padding: 22px; margin-bottom: 12px;
        }
        .kyc-card-title {
          font-size: 0.8rem; font-weight: 700; color: var(--ink);
          margin-bottom: 4px; display: flex; align-items: center; gap: 8px;
        }
        .kyc-card-sub {
          font-size: 0.68rem; color: var(--ink-faint); margin-bottom: 18px;
        }

        /* Doc type selector */
        .kyc-doc-types {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;
        }
        .kyc-doc-type {
          padding: 8px 16px; border-radius: 8px;
          border: 1px solid var(--line-strong);
          background: var(--surface); color: var(--ink-dim);
          font-family: var(--mono); font-size: 0.68rem;
          cursor: pointer; transition: all 0.15s;
        }
        .kyc-doc-type.selected {
          border-color: var(--accent); color: var(--accent);
          background: rgba(56,189,248,0.08);
        }
        .kyc-doc-type:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Upload slots */
        .kyc-slots { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .kyc-slots.single { grid-template-columns: 1fr; max-width: 300px; }

        .kyc-slot {
          border: 1.5px dashed var(--line-strong);
          border-radius: 12px; min-height: 140px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          cursor: pointer; overflow: hidden;
          transition: border-color 0.2s, background 0.2s;
          position: relative;
        }
        .kyc-slot:hover { border-color: var(--accent); background: var(--surface); }

        .kyc-slot-empty {
          display: flex; flex-direction: column;
          align-items: center; gap: 8px; padding: 20px;
          text-align: center;
        }
        .kyc-slot-label {
          font-size: 0.75rem; font-weight: 600; color: var(--ink-dim);
        }
        .kyc-slot-hint {
          font-size: 0.62rem; color: var(--ink-faint);
        }
        .kyc-slot-preview {
          width: 100%; height: 140px; object-fit: cover;
        }
        .kyc-slot-name {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.6); padding: 4px 8px;
          font-size: 0.6rem; color: white; font-family: var(--mono);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* Error / success */
        .kyc-error {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: var(--red-l); border: 1px solid var(--red);
          font-family: var(--mono); font-size: 0.7rem; color: var(--red);
        }
        .kyc-success {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: 10px; margin-bottom: 14px;
          background: var(--green-l); border: 1px solid var(--green);
          font-family: var(--mono); font-size: 0.7rem; color: var(--green);
        }

        /* Submit */
        .kyc-submit {
          width: 100%; background: var(--accent); color: var(--bg);
          border: none; border-radius: 10px; padding: 14px;
          font-family: var(--mono); font-size: 0.78rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          transition: opacity 0.15s;
        }
        .kyc-submit:hover:not(:disabled) { opacity: 0.85; }
        .kyc-submit:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Info list */
        .kyc-info {
          display: flex; flex-direction: column; gap: 8px; margin-top: 4px;
        }
        .kyc-info-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 0.72rem; color: var(--ink-dim);
        }
        .kyc-info-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--accent); flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .kyc-slots { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="kyc-wrap">
        <p className="kyc-brand">Apex · Markets</p>
        <h1 className="kyc-title">Identity Verification</h1>
        <p className="kyc-sub">Verify your identity to unlock full trading features.</p>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 size={20} style={{ color: "var(--ink-faint)", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <>
            {submission && <StatusBanner submission={submission} />}

            {!isLocked && (
              <>
                {/* Steps indicator */}
                <div className="kyc-steps">
                  <div className="kyc-step active">
                    <ShieldCheck size={10} /> 1. Choose document
                  </div>
                  <div className="kyc-step active">
                    <Upload size={10} /> 2. Upload photos
                  </div>
                  <div className="kyc-step active">
                    <Camera size={10} /> 3. Selfie
                  </div>
                </div>

                {/* Doc type */}
                <div className="kyc-card">
                  <p className="kyc-card-title">
                    <FileText size={15} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
                    Select Document Type
                  </p>
                  <p className="kyc-card-sub">Choose a government-issued photo ID.</p>
                  <div className="kyc-doc-types">
                    {DOC_TYPES.map((d) => (
                      <button
                        key={d.value}
                        className={`kyc-doc-type ${docType === d.value ? "selected" : ""}`}
                        onClick={() => setDocType(d.value)}
                        disabled={submitting}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Document upload */}
                <div className="kyc-card">
                  <p className="kyc-card-title">
                    <Upload size={15} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
                    Upload Document
                  </p>
                  <p className="kyc-card-sub">
                    {selectedDoc.needsBack
                      ? "Upload clear photos of both sides."
                      : "Upload a clear photo of your document."}
                  </p>
                  <div className={`kyc-slots ${!selectedDoc.needsBack ? "single" : ""}`}>
                    <FileSlot
                      label="Front"
                      hint="Clear, unobstructed photo"
                      file={frontFile}
                      preview={frontPrev}
                      onChange={setFile("front")}
                      disabled={submitting}
                    />
                    {selectedDoc.needsBack && (
                      <FileSlot
                        label="Back"
                        hint="Include all four corners"
                        file={backFile}
                        preview={backPrev}
                        onChange={setFile("back")}
                        disabled={submitting}
                      />
                    )}
                  </div>
                </div>

                {/* Selfie */}
                <div className="kyc-card">
                  <p className="kyc-card-title">
                    <Camera size={15} strokeWidth={1.8} style={{ color: "var(--accent)" }} />
                    Selfie
                  </p>
                  <p className="kyc-card-sub">
                    A photo of your face. Make sure it's well-lit and matches your document.
                  </p>
                  <div className="kyc-slots single">
                    <FileSlot
                      label="Selfie photo"
                      hint="Face clearly visible, good lighting"
                      file={selfieFile}
                      preview={selfiePrev}
                      onChange={setFile("selfie")}
                      disabled={submitting}
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div className="kyc-card">
                  <p className="kyc-card-title">Requirements</p>
                  <div className="kyc-info">
                    {[
                      "Document must be valid and not expired",
                      "All text and photos must be clearly readable",
                      "No black and white scans or photocopies",
                      "File size under 10MB (JPG, PNG, or PDF)",
                      "Selfie must match the document photo",
                    ].map((t) => (
                      <div className="kyc-info-item" key={t}>
                        <div className="kyc-info-dot" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="kyc-error">
                    <AlertTriangle size={13} /> {error}
                  </div>
                )}
                {success && (
                  <div className="kyc-success">
                    <CheckCircle2 size={13} /> Documents submitted successfully. We'll review within 1–2 business days.
                  </div>
                )}

                <button
                  className="kyc-submit"
                  onClick={handleSubmit}
                  disabled={submitting || !frontFile || !selfieFile}
                >
                  {submitting ? (
                    <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Uploading...</>
                  ) : (
                    <><ShieldCheck size={14} /> Submit for Verification</>
                  )}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
