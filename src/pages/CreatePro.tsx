import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PromptHelperDialog from "@/components/PromptHelperDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Loader2, Sparkles, Crown } from "lucide-react";
import { videoGenerationSchema } from "@/lib/validations";

const PRO_MODELS = [
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

const CreatePro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingTier, setCheckingTier] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sora-2-pro-text-to-video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("10");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [promptHelperOpen, setPromptHelperOpen] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has pro tier
      const { data: profile } = await supabase
        .from("profiles")
        .select("tier")
        .eq("id", session.user.id)
        .single();

      if (profile?.tier !== "pro") {
        toast.error("Pro subscription required");
        navigate("/account");
        return;
      }

      setCheckingTier(false);
    };

    checkAccess();

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

  // Pre-fill prompt if coming from remix
  useEffect(() => {
    if (location.state?.prompt) {
      setPrompt(location.state.prompt);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("Please sign in to create videos");
      return;
    }

    // Validate inputs
    const validation = videoGenerationSchema.safeParse({
      prompt,
      model,
      aspectRatio,
      duration,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
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

      if (!profile || profile.credits < 1) {
        toast.error("Insufficient credits. Please purchase more credits.");
        setLoading(false);
        return;
      }

      let imageUrl = null;

      // Handle image upload for image-to-video
      if (imageFile && model.includes("image-to-video")) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("video-images")
          .upload(fileName, imageFile);

        if (uploadError) {
          toast.error("Failed to upload image");
          setLoading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("video-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create video record
      const { data: video, error: videoError } = await supabase
        .from("videos")
        .insert({
          user_id: session.user.id,
          prompt,
          model,
          aspect_ratio: aspectRatio,
          n_frames: parseInt(duration) * 30,
          status: "pending",
          image_url: imageUrl,
        })
        .select()
        .single();

      if (videoError) {
        toast.error("Failed to create video record");
        setLoading(false);
        return;
      }

      // Call generate-video function
      const { error: functionError } = await supabase.functions.invoke("generate-video", {
        body: { videoId: video.id },
      });

      if (functionError) {
        toast.error("Failed to start video generation");
        setLoading(false);
        return;
      }

      toast.success("Video generation started! Check your library.");
      navigate("/library");
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (checkingTier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 md:px-6 py-24 md:py-32">
        <Card className="max-w-2xl mx-auto border-accent/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-accent" />
              <CardTitle className="text-2xl font-serif">Create Pro</CardTitle>
            </div>
            <CardDescription>
              Generate professional videos with Sora 2 Pro models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">Video Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPromptHelperOpen(true)}
                    className="text-accent hover:text-accent/80"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    AI Helper
                  </Button>
                </div>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to create..."
                  className="min-h-32 resize-none"
                  required
                />
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRO_MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload for Image-to-Video */}
              {model.includes("image-to-video") && (
                <div className="space-y-2">
                  <Label htmlFor="image">Starting Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    required
                  />
                </div>
              )}

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger id="aspectRatio">
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

              {/* Duration */}
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

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Generate Pro Video
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
      
      <PromptHelperDialog
        open={promptHelperOpen}
        onOpenChange={setPromptHelperOpen}
        onApplyPrompt={setPrompt}
      />
    </div>
  );
};

export default CreatePro;
