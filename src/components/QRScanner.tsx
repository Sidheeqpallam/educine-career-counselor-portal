import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { X, CameraOff, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'initializing' | 'scanning' | 'error'>('initializing');
  const [errorMsg, setErrorMsg] = useState('');

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code?.data) {
      stopCamera();
      onScan(code.data);
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [onScan, stopCamera]);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
        }

        setStatus('scanning');
        rafRef.current = requestAnimationFrame(tick);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.name === 'NotAllowedError'
              ? 'Camera permission denied. Please allow camera access and try again.'
              : err.message
            : 'Unable to access camera.';
        setErrorMsg(msg);
        setStatus('error');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [tick, stopCamera]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '1rem',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '24rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
          }}
        >
          <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
            Scan Student QR Code
          </span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '9999px',
              width: '2rem',
              height: '2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
            aria-label="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera / Status */}
        <div style={{ position: 'relative', background: '#111', aspectRatio: '4/3', overflow: 'hidden' }}>
          {/* Video */}
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: status === 'scanning' ? 'block' : 'none',
            }}
            muted
            playsInline
          />
          {/* Hidden canvas for frame analysis */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Overlay guides (only when scanning) */}
          {status === 'scanning' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Dimmed surround */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.35)',
                  mask: 'radial-gradient(ellipse 65% 65% at center, transparent 0%, black 100%)',
                  WebkitMask: 'radial-gradient(ellipse 65% 65% at center, transparent 0%, black 100%)',
                }}
              />
              {/* Corner markers */}
              {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
                <div
                  key={corner}
                  style={{
                    position: 'absolute',
                    width: '2.5rem',
                    height: '2.5rem',
                    border: '3px solid #16a34a',
                    borderRadius: '2px',
                    ...(corner === 'tl' && { top: '18%', left: '18%', borderRight: 'none', borderBottom: 'none' }),
                    ...(corner === 'tr' && { top: '18%', right: '18%', borderLeft: 'none', borderBottom: 'none' }),
                    ...(corner === 'bl' && { bottom: '18%', left: '18%', borderRight: 'none', borderTop: 'none' }),
                    ...(corner === 'br' && { bottom: '18%', right: '18%', borderLeft: 'none', borderTop: 'none' }),
                  }}
                />
              ))}
              {/* Scan line animation */}
              <div
                style={{
                  position: 'absolute',
                  left: '18%',
                  right: '18%',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #16a34a, transparent)',
                  animation: 'scanline 2s ease-in-out infinite',
                }}
              />
            </div>
          )}

          {/* Initializing */}
          {status === 'initializing' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: 'white',
              }}
            >
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4ade80' }} />
              <p style={{ fontSize: '0.85rem', color: '#d1fae5' }}>Starting camera…</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <CameraOff className="w-10 h-10" style={{ color: '#f87171' }} />
              <p style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.5 }}>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Hint */}
        <div
          style={{
            padding: '0.75rem 1rem',
            background: '#f0fdf4',
            borderTop: '1px solid #bbf7d0',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 500, margin: 0 }}>
            Point the camera at a student's QR code to load their profile
          </p>
        </div>
      </div>

      {/* Scan-line keyframes injected via style tag */}
      <style>{`
        @keyframes scanline {
          0%   { top: 20%; }
          50%  { top: 76%; }
          100% { top: 20%; }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
