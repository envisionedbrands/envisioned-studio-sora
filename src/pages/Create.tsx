import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
import Footer from "@/components/Footer";
import PromptHelperDialog from "@/components/PromptHelperDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Loader2, Sparkles } from "lucide-react";
import { videoGenerationSchema } from "@/lib/validations";
import { useTranslation } from "react-i18next";

const MODELS = [
  { value: "sora-2-text-to-video", label: "Sora 2 - Text to Video" },
  { value: "sora-2-image-to-video", label: "Sora 2 - Image to Video" },
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
  const location = useLocation();
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("sora-2-text-to-video");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [duration, setDuration] = useState("10");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [promptHelperOpen, setPromptHelperOpen] = useState(false);

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

  // Pre-fill prompt if coming from remix
  useEffect(() => {
    if (location.state?.prompt) {
      setPrompt(location.state.prompt);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error(t('common.errors.signInRequired'));
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

      if (!profile || profile.credits <= 0) {
        toast.error(t('common.errors.insufficientCredits'));
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
        
        // Check for rate limit error
        if (functionError.message?.includes('Rate limit exceeded') || 
            functionError.message?.includes('Too many')) {
          toast.error("Rate limit exceeded. Please wait a few minutes and try again.");
        } else {
          toast.error(t('common.errors.generationFailed'));
        }
        setLoading(false);
        return;
      }

      toast.success(t('common.success.generationStarted'));
      navigate("/library");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || t('common.errors.generationFailed'));
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
            <h1 className="font-serif text-5xl font-bold mb-4">{t('create.title')}</h1>
            <p className="text-xl text-muted-foreground">
              {t('create.subtitle')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">{t('create.settingsTitle')}</CardTitle>
              <CardDescription className="mb-6">{t('create.settingsDesc')}</CardDescription>
              <p className="mt-16 text-sm font-bold font-mono text-muted-foreground mb-8">
                {t('create.warning')}{' '}
                <Link to="/failed-videos" className="text-accent hover:underline">
                  {t('create.warningLink')}
                </Link>.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt">{t('create.prompt')} *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPromptHelperOpen(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t('create.creativeDirector')}
                    </Button>
                  </div>
                  <Textarea
                    id="prompt"
                    placeholder={t('create.promptPlaceholder')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                    rows={4}
                    className="resize-y min-h-[100px]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="model">{t('create.model')}</Label>
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
                    <Label htmlFor="aspect-ratio">{t('create.aspectRatio')}</Label>
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
                    <Label htmlFor="duration">{t('create.duration')}</Label>
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
                      <Label htmlFor="image">{t('create.inputImage')}</Label>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      {t('create.generating')}
                    </>
                  ) : (
                    t('create.generateVideo')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
      
      <PromptHelperDialog
        open={promptHelperOpen}
        onOpenChange={setPromptHelperOpen}
        onApplyPrompt={(improvedPrompt) => {
          setPrompt(improvedPrompt);
          setPromptHelperOpen(false);
        }}
        mode="single"
      />
    </div>
  );
};

export default Create;
