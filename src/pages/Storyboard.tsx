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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const ASPECT_RATIOS = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
];

const DURATIONS = [
  { value: "10", label: "10 seconds" },
  { value: "15", label: "15 seconds" },
  { value: "25", label: "25 seconds" },
];

const Storyboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("10");
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
      toast.error("Please sign in to create storyboards");
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

      // Upload reference image if provided
      if (imageFile) {
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

      // Create video record with storyboard model
      const { data: videoData, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: session.user.id,
          model: "sora-2-pro-storyboard",
          prompt,
          aspect_ratio: aspectRatio,
          n_frames: parseInt(duration) * 30,
          image_url: imageUrl,
          remove_watermark: false,
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

      toast.success("Storyboard generation started! Storyboards take a few minutes to generate — they will appear in your library when ready.");
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
            <h1 className="font-serif text-5xl font-bold mb-4">Create Storyboard</h1>
            <p className="text-xl text-muted-foreground">
              Visualize your narrative with AI-generated storyboards
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Storyboard Settings</CardTitle>
              <CardDescription className="mb-6">Configure your storyboard parameters</CardDescription>
              <p className="mt-16 text-sm font-bold font-mono text-muted-foreground mb-8">
                ⚠️ Occasionally, a storyboard may fail due to Sora's internal moderation policies — this isn't an app error, it's a platform restriction.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Story Description *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your story or scene sequence in detail..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Describe the sequence of scenes or narrative arc you want to visualize
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Reference Image (Optional)</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload a reference image to guide the storyboard style
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Generating Storyboard...
                    </>
                  ) : (
                    "Generate Storyboard"
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

export default Storyboard;
