import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WebcamFeedProps {
  onVideoReady: (video: HTMLVideoElement) => void;
  currentEmotion: string;
}

export const WebcamFeed = ({ onVideoReady, currentEmotion }: WebcamFeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const startWebcam = async () => {
    setIsLoading(true);
    try {
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecure) {
        throw new Error('Camera access requires HTTPS. Please use HTTPS or localhost.');
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsActive(true);
        onVideoReady(videoRef.current);
        
        toast({
          title: "Camera Active",
          description: "Emotion detection is now running",
        });
      }
    } catch (error: any) {
      console.error('Error accessing webcam:', error);
      let errorMessage = "Could not access your camera. Please check permissions.";
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and refresh the page.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found. Please connect a camera and try again.";
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera not supported. Please use a modern browser with HTTPS.";
      } else if (error.message.includes('HTTPS')) {
        errorMessage = "Camera requires HTTPS. Please use HTTPS or localhost.";
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
      
      toast({
        title: "Camera Stopped",
        description: "Emotion detection paused",
      });
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Card className={`relative overflow-hidden emotion-adaptive ${currentEmotion ? `emotion-${currentEmotion}` : ''} transition-all duration-500 border-2`}>
      <div className="aspect-video bg-muted relative">
        {isActive ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
            <div className="text-center space-y-4">
              <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Camera inactive</p>
            </div>
          </div>
        )}
        
        {/* Emotion indicator overlay */}
        {isActive && currentEmotion && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg backdrop-blur-sm">
            <span className="text-sm font-medium capitalize">{currentEmotion}</span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex justify-center">
        <Button
          onClick={isActive ? stopWebcam : startWebcam}
          disabled={isLoading}
          variant={isActive ? "destructive" : "default"}
          className="flex items-center gap-2"
        >
          {isActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              {isLoading ? 'Starting...' : 'Start Camera'}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};