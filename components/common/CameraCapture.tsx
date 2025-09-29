
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import Spinner from './Spinner';

interface CameraCaptureProps {
  onCapture?: (imageData: string) => void;
  width?: number;
  height?: number;
  showOverlay?: boolean;
}

export interface CameraCaptureHandle {
  captureFrame: () => string | null;
}

const CameraCapture = forwardRef<CameraCaptureHandle, CameraCaptureProps>(
  ({ width = 640, height = 480, showOverlay = false }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width, height } });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          if (err instanceof Error) {
            setError(`Could not access camera: ${err.message}. Please grant permission.`);
          } else {
            setError("An unknown error occurred while accessing the camera.");
          }
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("Your browser does not support camera access.");
        setIsLoading(false);
      }
    }, [width, height]);
    
    useEffect(() => {
        startCamera();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [startCamera]);

    const handleCanPlay = () => {
        setIsLoading(false);
    };

    useImperativeHandle(ref, () => ({
      captureFrame: () => {
        if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
            return canvasRef.current.toDataURL('image/jpeg');
          }
        }
        return null;
      }
    }));

    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden w-full aspect-video flex items-center justify-center" style={{ aspectRatio: `${width}/${height}`}}>
        <video ref={videoRef} onCanPlay={handleCanPlay} className="w-full h-full" playsInline />
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <Spinner />
                <p className="text-white mt-2">Starting camera...</p>
            </div>
        )}
        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-80 p-4">
                <p className="text-white text-center font-semibold">{error}</p>
                 <button onClick={startCamera} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Retry
                </button>
            </div>
        )}
        {showOverlay && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2/3 h-2/3 border-4 border-dashed border-green-400 rounded-full opacity-75" style={{boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'}}></div>
            </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }
);

CameraCapture.displayName = "CameraCapture";
export default CameraCapture;
