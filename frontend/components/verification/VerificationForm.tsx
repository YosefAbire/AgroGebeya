'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verificationService } from '@/lib/services/verification-service';
import { CheckCircle, ScanLine, Hash, CreditCard, X, Upload, ImageIcon, Camera } from 'lucide-react';
import Image from 'next/image';

interface VerificationFormProps {
  token: string;
  onSuccess?: () => void;
  pendingPhotosOnly?: boolean;
}

type InputMethod = 'fin' | 'sn' | 'scan';

const METHOD_CONFIG: Record<InputMethod, { label: string; icon: typeof Hash; digits: number; placeholder: string }> = {
  fin: { label: 'FIN', icon: Hash, digits: 12, placeholder: '123456789012' },
  sn:  { label: 'Serial No.', icon: CreditCard, digits: 8, placeholder: '12345678' },
  scan:{ label: 'Scan', icon: ScanLine, digits: 0, placeholder: 'Scan barcode...' },
};

// ── Image picker: camera or file ──────────────────────────────────────────────
function ImagePicker({
  label, hint, file, preview, onSelect, onClear,
}: {
  label: string; hint: string;
  file: File | null; preview: string | null;
  onSelect: (f: File, p: string) => void;
  onClear: () => void;
}) {
  const fileRef    = useRef<HTMLInputElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream]         = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const openCamera = async () => {
    setCameraError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(s);
      setCameraOpen(true);
      // attach stream after modal renders
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      }, 80);
    } catch {
      // Camera not available or permission denied — fall back to file input with capture
      setCameraError('Camera not available. Please choose a file instead.');
      fileRef.current?.click();
    }
  };

  const closeCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
  };

  const capture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `id-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      onSelect(f, URL.createObjectURL(f));
      closeCamera();
    }, 'image/jpeg', 0.92);
  };

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onSelect(f, URL.createObjectURL(f));
    e.target.value = '';
  };

  return (
    <div className="space-y-1.5">
      <Label className="font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>

      {preview ? (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <Image src={preview} alt={label} width={400} height={220}
            className="w-full object-cover max-h-44" unoptimized />
          <button type="button" onClick={onClear}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="px-3 py-1 text-xs text-muted-foreground truncate bg-background/80">{file?.name}</p>
        </div>
      ) : (
        <>
          {cameraError && <p className="text-xs text-destructive">{cameraError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={openCamera}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-5 text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors">
              <Camera className="h-7 w-7" />
              <span className="text-sm font-medium">Take Photo</span>
              <span className="text-xs">Use camera</span>
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-5 text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors">
              <ImageIcon className="h-7 w-7" />
              <span className="text-sm font-medium">Choose File</span>
              <span className="text-xs">Gallery or files</span>
            </button>
          </div>
        </>
      )}

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 bg-black/80">
            <p className="text-white text-sm font-medium">{label}</p>
            <button type="button" onClick={closeCamera} className="text-white hover:text-gray-300">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted
              className="w-full h-full object-cover" />
            {/* ID card guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/70 rounded-xl w-4/5 aspect-[1.586/1] shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
            <p className="absolute bottom-24 left-0 right-0 text-center text-white/80 text-xs">
              Align your ID card within the frame
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 py-6 bg-black/80">
            <button type="button" onClick={capture}
              className="h-16 w-16 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 active:scale-95 transition-transform flex items-center justify-center">
              <Camera className="h-7 w-7 text-black" />
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* File input (gallery / files) */}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
export function VerificationForm({ token, onSuccess, pendingPhotosOnly = false }: VerificationFormProps) {
  const [method, setMethod] = useState<InputMethod>('fin');
  const [idValue, setIdValue] = useState('');
  const [step, setStep] = useState<1 | 2>(pendingPhotosOnly ? 2 : 1);
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  const digits = idValue.replace(/\D/g, '');
  const maxDigits = METHOD_CONFIG[method].digits;

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setIdValue(method !== 'scan' ? raw.replace(/\D/g, '').slice(0, maxDigits) : raw);
    setError(null);
  };

  // Step 1 — submit ID number (optional: skip allowed)
  const handleStep1 = async (skip = false) => {
    if (!skip) {
      if (method === 'fin'  && digits.length !== 12) { setError('FIN must be exactly 12 digits'); return; }
      if (method === 'sn'   && digits.length !== 8)  { setError('Serial Number must be exactly 8 digits'); return; }
      if (method === 'scan' && digits.length !== 8 && digits.length !== 12) {
        setError('Scanned ID must be 8 or 12 digits'); return;
      }
    }

    if (!skip) {
      setLoading(true);
      setError(null);
      try {
        await verificationService.submit({ national_id: digits, business_name: businessName || undefined, business_address: businessAddress || undefined }, token);
      } catch (err: any) {
        if (!err.message?.includes('already pending') && !err.message?.includes('already verified')) {
          setError(err.message || 'Failed to submit ID number');
          setLoading(false);
          return;
        }
      } finally {
        setLoading(false);
      }
    }
    setStep(2);
  };

  // Step 2 — upload photos
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontFile || !backFile) { setError('Please upload both front and back photos of your ID'); return; }
    setLoading(true);
    setError(null);
    try {
      await verificationService.uploadIdImages(frontFile, backFile, token);
      setSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──
  if (success) {
    return (
      <Card>
        <CardContent className="pt-8 pb-6 text-center">
          <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Verification Submitted</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Your ID photos have been submitted for review. You will be notified once approved — usually within 1–2 business days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>National ID Verification</CardTitle>
        <CardDescription>
          {pendingPhotosOnly
            ? 'Upload photos of your ID card to complete verification'
            : step === 1
            ? 'Step 1 of 2 — Enter your ID number (optional)'
            : 'Step 2 of 2 — Upload photos of your ID card'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress bar */}
        {!pendingPhotosOnly && (
          <div className="flex gap-1.5">
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-secondary'}`} />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {error}
              <button type="button" onClick={() => setError(null)}><X className="h-4 w-4" /></button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Step 1: ID number ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Method tabs */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(METHOD_CONFIG) as InputMethod[]).map((m) => {
                const Icon = METHOD_CONFIG[m].icon;
                return (
                  <button key={m} type="button" onClick={() => { setMethod(m); setIdValue(''); setError(null); if (m === 'scan') setTimeout(() => scanRef.current?.focus(), 80); }}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all ${method === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'}`}>
                    <Icon className="h-5 w-5" />
                    {METHOD_CONFIG[m].label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nid">
                {method === 'fin' ? 'FIN — 12 digits' : method === 'sn' ? 'Serial Number — 8 digits' : 'Barcode / QR value'}
              </Label>
              <div className="relative">
                <Input
                  id="nid"
                  ref={method === 'scan' ? scanRef : undefined}
                  value={idValue}
                  onChange={handleIdChange}
                  onKeyDown={method === 'scan' ? (e) => { if (e.key === 'Enter') { e.preventDefault(); handleStep1(); } } : undefined}
                  placeholder={METHOD_CONFIG[method].placeholder}
                  inputMode={method !== 'scan' ? 'numeric' : 'text'}
                  autoComplete="off"
                  className="pr-16 font-mono tracking-widest"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
                  {digits.length}{method !== 'scan' && `/${maxDigits}`}
                </span>
              </div>
              {method !== 'scan' && (
                <div className="flex gap-0.5 pt-0.5">
                  {Array.from({ length: maxDigits }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < digits.length ? 'bg-primary' : 'bg-secondary'}`} />
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Your ID number is encrypted and stored securely.</p>
            </div>

            {/* Optional business info */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Info (Retailers)</p>
              <div className="space-y-2">
                <Label htmlFor="biz_name">Business / Store Name</Label>
                <Input id="biz_name" value={businessName} onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Addis Fresh Market" disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz_addr">Business Address</Label>
                <Input id="biz_addr" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="e.g. Bole, Addis Ababa" disabled={loading} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => handleStep1()} disabled={loading || digits.length === 0} className="flex-1">
                {loading ? 'Submitting...' : 'Continue'}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleStep1(true)} disabled={loading}>
                Skip — go to photos
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Photos ── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-5">
            <ImagePicker
              label="Front of ID Card"
              hint="Clear photo of the front — your name, photo, and ID number must be visible"
              file={frontFile} preview={frontPreview}
              onSelect={(f, p) => { setFrontFile(f); setFrontPreview(p); setError(null); }}
              onClear={() => { setFrontFile(null); setFrontPreview(null); }}
            />

            <ImagePicker
              label="Back of ID Card"
              hint="Clear photo of the back — barcode or serial number must be visible"
              file={backFile} preview={backPreview}
              onSelect={(f, p) => { setBackFile(f); setBackPreview(p); setError(null); }}
              onClear={() => { setBackFile(null); setBackPreview(null); }}
            />

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 flex-shrink-0" />
              Photos are stored securely and only used for identity verification.
            </p>

            <div className="flex gap-2">
              {!pendingPhotosOnly && (
                <Button type="button" variant="outline" onClick={() => { setStep(1); setError(null); }} disabled={loading}>
                  Back
                </Button>
              )}
              <Button type="submit" disabled={loading || !frontFile || !backFile} className="flex-1">
                {loading ? 'Uploading...' : 'Submit Verification'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
