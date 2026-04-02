import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Volume2, Play, Pause, Download, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", desc: "Babae, malambing" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", desc: "Lalaki, malalim" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", desc: "Lalaki, British" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", desc: "Babae, British" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", desc: "Lalaki, American" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", desc: "Babae, British" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", desc: "Lalaki, American" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", desc: "Lalaki, Australian" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", desc: "Babae, American" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", desc: "Lalaki, American" },
];

const TextToSpeech = () => {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Mag-type muna ng text!");
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: text.trim(), voiceId }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);

      toast.success("Audio generated!");
    } catch (err: any) {
      console.error("TTS error:", err);
      toast.error(err.message || "Failed to generate audio");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `tts-${Date.now()}.mp3`;
    a.click();
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setText("");
  };

  const selectedVoice = VOICES.find(v => v.id === voiceId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-24 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Volume2 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Text to Speech</h1>
            <p className="text-sm text-muted-foreground">I-convert ang text sa natural na boses gamit ang AI</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Voice Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pumili ng Boses</label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map(v => (
                  <SelectItem key={v.id} value={v.id}>
                    <span className="font-medium">{v.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">— {v.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">I-type ang text</label>
              <span className="text-xs text-muted-foreground">{text.length}/5000</span>
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 5000))}
              placeholder="I-type dito ang gusto mong i-convert sa speech..."
              className="min-h-[150px] bg-card border-border resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Generate Speech
              </>
            )}
          </Button>

          {/* Audio Controls */}
          {audioUrl && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                🎧 Generated Audio — {selectedVoice?.name}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={togglePlayback}>
                  {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;
