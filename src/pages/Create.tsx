import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const MODELS = [
  { value: "sora-2-text-to-video", label: "Sora 2 - Text to Video (Base)" },
  { value: "sora-2-image-to-video", label: "Sora 2 - Image to Video (Base)" },
  { value: "sora-2-pro-text-to-video", label: "Sora 2 Pro - Text to Video" },
  { value: "sora-2-pro-image-to-video", label: "Sora 2 Pro - Image to Video" },
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
];

const DURATIONS = [
  { value: "10", label: "10 seconds" },
  { value: "15", label: "15 seconds" },
  { value: "25", label: "25 seconds" },
];

const Create = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sora-2-text-to-video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("10");
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("Please sign in to create videos");
      return;
    }

    setLoading(true);

    try {
      // Check credits
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.credits <= 0) {
        toast.error("Insufficient credits");
        setLoading(false);
        return;
      }

      let imageUrl = null;

      // Upload image if provided
      if (imageFile && model.includes("image-to-video")) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("video-inputs")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("video-inputs")
          .getPublicUrl(uploadData.path);

        imageUrl = publicUrl;
      }

      // Create video record
      const { data: videoData, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: session.user.id,
          model,
          prompt,
          aspect_ratio: aspectRatio,
          n_frames: parseInt(duration) * 30, // Approximate frames
          image_url: imageUrl,
          remove_watermark: removeWatermark,
          status: "pending",
        })
        .select()
        .single();

      if (insertError || !videoData) throw insertError;

      // Call Cloud Function to start generation
      const { error: functionError } = await supabase.functions.invoke(
        "generate-video",
        {
          body: { videoId: videoData.id },
        }
      );

      if (functionError) {
        console.error("Function error:", functionError);
        toast.error("Failed to start generation");
        setLoading(false);
        return;
      }

      toast.success("Video generation started! Check your library in a few minutes.");
      navigate("/library");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to start generation");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h1 className="font-serif text-5xl font-bold mb-4">Create Video</h1>
            <p className="text-xl text-muted-foreground">
              Transform your ideas into cinematic reality
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Generation Settings</CardTitle>
              <CardDescription>Configure your video parameters</CardDescription>
              <div className="mt-3 p-3 rounded-md bg-muted/50 border border-muted-foreground/20">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Occasionally, a video may fail due to Sora's internal moderation policies — this isn't an app error, it's a platform restriction.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your video in detail..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODELS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger id="aspect-ratio">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ar) => (
                          <SelectItem key={ar.value} value={ar.value}>
                            {ar.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger id="duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {model.includes("image-to-video") && (
                    <div className="space-y-2">
                      <Label htmlFor="image">Input Image</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label htmlFor="watermark">Remove Watermark</Label>
                    <p className="text-sm text-muted-foreground">
                      Clean final output (Pro feature)
                    </p>
                  </div>
                  <Switch
                    id="watermark"
                    checked={removeWatermark}
                    onCheckedChange={setRemoveWatermark}
                  />
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Video"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Create;
