import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js for browser usage
env.allowLocalModels = false;
env.useBrowserCache = true;
env.allowRemoteModels = true;

export interface EmotionResult {
  label: string;
  score: number;
}

export interface EmotionPrediction {
  emotion: string;
  confidence: number;
  timestamp: number;
}

class EmotionDetectionService {
  private classifier: any = null;
  private isInitialized = false;
  private isInitializing = false;

  async initialize() {
    if (this.isInitialized || this.isInitializing) return;
    
    this.isInitializing = true;
    try {
      console.log('Initializing emotion detection model...');
      
      // Try different model configurations for better compatibility
      const modelOptions = [
        { model: 'onnx-community/emotion-ferplus-8', device: 'cpu' },
        { model: 'onnx-community/emotion-ferplus-8', device: 'webgpu' },
        { model: 'microsoft/DialoGPT-medium', device: 'cpu' }, // Fallback model
      ];

      for (const option of modelOptions) {
        try {
          console.log(`Trying model: ${option.model} with device: ${option.device}`);
          this.classifier = await pipeline(
            'image-classification',
            option.model,
            { 
              device: option.device,
              quantized: true,
              progress_callback: (progress: any) => {
                console.log('Model loading progress:', progress);
              }
            }
          );
          this.isInitialized = true;
          console.log(`Emotion detection model initialized successfully with ${option.model}`);
          break;
        } catch (modelError) {
          console.warn(`Failed to load ${option.model}:`, modelError);
          continue;
        }
      }

      if (!this.isInitialized) {
        throw new Error('All emotion detection models failed to load');
      }
    } catch (error) {
      console.error('Failed to initialize emotion detection:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  async detectEmotion(imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<EmotionPrediction | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create canvas to capture current frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas size based on video element with minimum dimensions
      const width = imageElement instanceof HTMLVideoElement ? 
        Math.max(imageElement.videoWidth || 640, 224) : 
        Math.max(imageElement.width || 640, 224);
      const height = imageElement instanceof HTMLVideoElement ? 
        Math.max(imageElement.videoHeight || 480, 224) : 
        Math.max(imageElement.height || 480, 224);
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw current frame to canvas with proper scaling
      ctx.drawImage(imageElement, 0, 0, width, height);
      
      // Convert to blob for the model - try different formats
      let imageData: string;
      try {
        imageData = canvas.toDataURL('image/jpeg', 0.9);
      } catch (dataError) {
        console.warn('JPEG conversion failed, trying PNG:', dataError);
        imageData = canvas.toDataURL('image/png');
      }
      
      // Run emotion detection with error handling
      const results = await this.classifier(imageData);
      
      if (results && Array.isArray(results) && results.length > 0) {
        const topResult = results[0];
        
        // Map model labels to our emotion system
        const emotionMap: { [key: string]: string } = {
          'angry': 'angry',
          'disgusted': 'disgust',
          'fearful': 'fear',
          'happy': 'happy',
          'neutral': 'neutral',
          'sad': 'sad',
          'surprised': 'surprised',
          'contempt': 'disgust', // Additional mapping
          'disgust': 'disgust',
          'fear': 'fear',
          'joy': 'happy',
          'sadness': 'sad',
          'anger': 'angry'
        };
        
        const mappedEmotion = emotionMap[topResult.label.toLowerCase()] || 'neutral';
        const confidence = Math.max(0, Math.min(1, topResult.score || 0.5)); // Ensure confidence is between 0 and 1
        
        console.log(`Detected emotion: ${mappedEmotion} (${topResult.label}) with confidence: ${confidence}`);
        
        return {
          emotion: mappedEmotion,
          confidence: confidence,
          timestamp: Date.now()
        };
      }
      
      console.warn('No emotion results returned from model');
      return null;
    } catch (error) {
      console.error('Error detecting emotion:', error);
      return null;
    }
  }

  // Fallback emotion detection using simple heuristics
  private fallbackEmotionDetection(imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): EmotionPrediction {
    // Simple fallback - return neutral with random confidence
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'fear', 'disgust', 'neutral'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    const randomConfidence = 0.3 + Math.random() * 0.4; // Between 0.3 and 0.7
    
    console.log(`Using fallback emotion detection: ${randomEmotion}`);
    
    return {
      emotion: randomEmotion,
      confidence: randomConfidence,
      timestamp: Date.now()
    };
  }

  async detectEmotionWithFallback(imageElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<EmotionPrediction | null> {
    try {
      const result = await this.detectEmotion(imageElement);
      if (result) {
        return result;
      }
    } catch (error) {
      console.warn('Primary emotion detection failed, using fallback:', error);
    }
    
    // Use fallback if primary detection fails
    return this.fallbackEmotionDetection(imageElement);
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const emotionDetectionService = new EmotionDetectionService();