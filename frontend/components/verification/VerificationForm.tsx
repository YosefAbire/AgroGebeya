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

const METHOD_CONFIG: Record<InputMethod, { label: string; icon: typeof Hash; digits: number; placeholder: string; description: string }> = {
  fin: {
    label: 'FIN',
    icon: Hash,
    digits: 12,
    placeholder: '123456789012',
    description: 'Fayda ID Number — 12 digits printed on your national ID card',
  },
  sn: {
    label: 'Serial Number',
    icon: CreditCard,
    digits: 8,
    placeholder: '12345678',
    description: 'Serial Number — 8 digits on the back of your national ID card',
  },
  scan: {
    label: 'Scan Barcode',
    icon: ScanLine,
    digits: 0,
    placeholder: 'Scan or paste barcode value...',
    description: 'Scan the barcode/QR code on your national ID card',
  },
};

function validateId(method: InputMethod, value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (method === 'fin' && digits.length !== 12) return 'FIN must be exactly 12 digits';
  if (method === 'sn' && digits.length !== 8) return 'Serial Number must be exactly 8 digits';
  if (method === 'scan') {
    if (digits.length !== 8 && digits.length !== 12) return 'Scanned ID must be 8 digits (SN) or 12 digits (FIN)';
  }
  return null;
}

interface ImagePickerProps {
  label: string;
  hint: string;
  file: File | null;
  preview: string | null;
  onSelect: (file: File, preview: string) => void;
  onClear: () => void;
}

function ImagePicker({ label, hint, file, preview, onSelect, onClear }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    onSelect(f, url);
    // reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {preview ? (
        <div className="relative rounded-lg border border-border overflow-hidden">
          <Image src={preview} alt={label} width={400} height={220} className="w-full object-cover max-h-44" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="px-3 py-1.5 text-xs text-muted-foreground truncate">{file?.name}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {/* Take photo with camera */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-5 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <Camera className="h-7 w-7" />
            <span className="text-sm font-medium">Take Photo</span>
            <span className="text-xs text-center">Use your camera</span>
          </button>

          {/* Choose from files / gallery */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-5 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <ImageIcon className="h-7 w-7" />
            <span className="text-sm font-medium">Choose File</span>
            <span className="text-xs text-center">Gallery or files</span>
          </button>
        </div>
      )}

      {/* Camera input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      {/* File/gallery input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

export function VerificationForm({ token, onSuccess, pendingPhotosOnly = false }: VerificationFormProps) {
  // Step 1: ID number
  const [method, setMethod] = useState<InputMethod>('fin');
  const [idValue, setIdValue] = useState('');
  const [step, setStep] = useState<1 | 2>(pendingPhotosOnly ? 2 : 1);

  // Step 2: ID photos
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  const handleMethodChange = (m: InputMethod) => {
    setMethod(m);
    setIdValue('');
    setError(null);
    if (m === 'scan') setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (method !== 'scan') {
      const digits = raw.replace(/\D/g, '');
      setIdValue(digits.slice(0, METHOD_CONFIG[method].digits));
    } else {
      setIdValue(raw);
    }
    setError(null);
  };

  const handleScanKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleStep1(); }
  };

  // Step 1: submit national ID number
  const handleStep1 = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const digits = idValue.replace(/\D/g, '');
    const validationError = validateId(method, digits);
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError(null);
    try {
      await verificationService.submit({ national_id: digits }, token);
      setStep(2);
    } catch (err: any) {
      // If already submitted, still allow going to step 2 to upload photos
      if (err.message?.includes('already pending')) {
        setStep(2);
      } else if (err.message?.includes('already verified')) {
        setError(err.message);
      } else {
        setError(err.message || 'Failed to submit verification');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: upload ID photos
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
      setError(err.message || 'Failed to upload ID images');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verification Submitted</h3>
            <p className="text-muted-foreground text-sm">
              Your National ID and photos have been submitted for review. You will be notified once approved.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = METHOD_CONFIG[method];

  return (
    <Card>
      <CardHeader>
        <CardTitle>National ID Verification</CardTitle>
        <CardDescription>
          {pendingPhotosOnly
            ? 'Upload photos of your ID card to complete verification'
            : step === 1
            ? 'Step 1 of 2 — Enter your Ethiopian National ID number'
            : 'Step 2 of 2 — Upload photos of your ID card'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Step indicator */}
        {!pendingPhotosOnly && (
          <div className="flex gap-2">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
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
          <form onSubmit={handleStep1} className="space-y-4">
            {/* Method selector */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(METHOD_CONFIG) as InputMethod[]).map((m) => {
                const Icon = METHOD_CONFIG[m].icon;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMethodChange(m)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-all ${
                      method === m
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {METHOD_CONFIG[m].label}
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-muted-foreground">{config.description}</p>

            <div className="space-y-2">
              <Label htmlFor="national_id">
                {method === 'fin' ? 'FIN (12 digits)' : method === 'sn' ? 'Serial Number (8 digits)' : 'Barcode / QR Value'}
              </Label>
              <div className="relative">
                <Input
                  id="national_id"
                  ref={method === 'scan' ? scanInputRef : undefined}
                  value={idValue}
                  onChange={handleChange}
                  onKeyDown={method === 'scan' ? handleScanKeyDown : undefined}
                  placeholder={config.placeholder}
                  inputMode={method !== 'scan' ? 'numeric' : 'text'}
                  autoComplete="off"
                  className="pr-16 font-mono tracking-widest"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
                  {idValue.replace(/\D/g, '').length}
                  {method !== 'scan' && `/${config.digits}`}
                </span>
              </div>

              {method !== 'scan' && (
                <div className="flex gap-1 pt-1">
                  {Array.from({ length: config.digits }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < idValue.length ? 'bg-primary' : 'bg-secondary'}`} />
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">Your ID number will be encrypted and stored securely.</p>
            </div>

            <Button type="submit" disabled={loading || idValue.replace(/\D/g, '').length === 0} className="w-full">
              {loading ? 'Submitting...' : 'Continue to Photo Upload'}
            </Button>
          </form>
        )}

        {/* ── Step 2: ID photos ── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="space-y-5">
            <ImagePicker
              label="Front of ID Card"
              hint="Take a clear photo of the front side showing your name and photo"
              file={frontFile}
              preview={frontPreview}
              onSelect={(f, p) => { setFrontFile(f); setFrontPreview(p); setError(null); }}
              onClear={() => { setFrontFile(null); setFrontPreview(null); }}
            />

            <ImagePicker
              label="Back of ID Card"
              hint="Take a clear photo of the back side showing the barcode or serial number"
              file={backFile}
              preview={backPreview}
              onSelect={(f, p) => { setBackFile(f); setBackPreview(p); setError(null); }}
              onClear={() => { setBackFile(null); setBackPreview(null); }}
            />

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Photos are stored securely and only used for identity verification.
            </p>

            <div className="flex gap-3">
              {!pendingPhotosOnly && (
                <Button type="button" variant="outline" onClick={() => { setStep(1); setError(null); }} disabled={loading} className="flex-1">
                  Back
                </Button>
              )}
              <Button type="submit" disabled={loading || !frontFile || !backFile} className={pendingPhotosOnly ? 'w-full' : 'flex-1'}>
                {loading ? 'Uploading...' : 'Submit Verification'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
