import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Heart, Zap, AlertTriangle, Frown, Smile, Meh } from 'lucide-react';

interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: number;
}

interface EmotionDashboardProps {
  currentEmotion: EmotionData | null;
  emotionHistory: EmotionData[];
  isModelReady: boolean;
}

const emotionIcons = {
  happy: Smile,
  sad: Frown,
  angry: AlertTriangle,
  surprised: Zap,
  fear: AlertTriangle,
  disgust: Frown,
  neutral: Meh,
};

const emotionColors = {
  happy: 'text-emotion-happy',
  sad: 'text-emotion-sad',
  angry: 'text-emotion-angry',
  surprised: 'text-emotion-surprised',
  fear: 'text-emotion-fear',
  disgust: 'text-emotion-disgust',
  neutral: 'text-emotion-neutral',
};

const emotionDescriptions = {
  happy: 'Joyful and positive',
  sad: 'Melancholic and down',
  angry: 'Frustrated and intense',
  surprised: 'Astonished and amazed',
  fear: 'Anxious and worried',
  disgust: 'Repulsed and displeased',
  neutral: 'Calm and balanced',
};

export const EmotionDashboard = ({ currentEmotion, emotionHistory, isModelReady }: EmotionDashboardProps) => {
  const getEmotionCounts = () => {
    const counts: { [key: string]: number } = {};
    emotionHistory.forEach(data => {
      counts[data.emotion] = (counts[data.emotion] || 0) + 1;
    });
    return counts;
  };

  const emotionCounts = getEmotionCounts();
  const totalDetections = emotionHistory.length;

  return (
    <div className="space-y-6">
      {/* Current Emotion Display */}
      <Card className={`emotion-adaptive ${currentEmotion ? `emotion-${currentEmotion.emotion}` : ''} transition-all duration-500 border-2`}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="w-5 h-5" />
            Current Emotion
          </CardTitle>
          <CardDescription>
            {isModelReady ? 'AI is analyzing your expressions' : 'Loading emotion detection model...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {currentEmotion ? (
            <>
              <div className="flex items-center justify-center gap-3">
                {(() => {
                  const Icon = emotionIcons[currentEmotion.emotion as keyof typeof emotionIcons] || Meh;
                  return <Icon className={`w-12 h-12 ${emotionColors[currentEmotion.emotion as keyof typeof emotionColors]}`} />;
                })()}
                <div>
                  <h3 className="text-2xl font-bold capitalize">{currentEmotion.emotion}</h3>
                  <p className="text-sm text-muted-foreground">
                    {emotionDescriptions[currentEmotion.emotion as keyof typeof emotionDescriptions]}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Confidence</span>
                  <span>{Math.round(currentEmotion.confidence * 100)}%</span>
                </div>
                <Progress value={currentEmotion.confidence * 100} className="h-2" />
              </div>
            </>
          ) : (
            <div className="py-8">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isModelReady ? 'Start your camera to detect emotions' : 'Preparing AI model...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emotion Statistics */}
      {totalDetections > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emotion Statistics</CardTitle>
            <CardDescription>
              Based on {totalDetections} detections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(emotionCounts).map(([emotion, count]) => {
              const percentage = (count / totalDetections) * 100;
              const Icon = emotionIcons[emotion as keyof typeof emotionIcons] || Meh;
              
              return (
                <div key={emotion} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${emotionColors[emotion as keyof typeof emotionColors]}`} />
                      <span className="capitalize">{emotion}</span>
                    </div>
                    <Badge variant="secondary">
                      {count} ({Math.round(percentage)}%)
                    </Badge>
                  </div>
                  <Progress value={percentage} className="h-1" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};