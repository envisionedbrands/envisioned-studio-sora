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
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Scene {
  id: string;
  description: string;
  duration: number;
}

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
  const [scenes, setScenes] = useState<Scene[]>([
    { id: "1", description: "", duration: 0 }
  ]);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [totalDuration, setTotalDuration] = useState(10);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

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

  const addScene = () => {
    setScenes([...scenes, { id: Date.now().toString(), description: "", duration: 0 }]);
  };

  const removeScene = (id: string) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter(scene => scene.id !== id));
    }
  };

  const updateScene = (id: string, field: keyof Scene, value: string | number) => {
    setScenes(scenes.map(scene => 
      scene.id === id ? { ...scene, [field]: value } : scene
    ));
  };

  const getTotalAllocated = () => {
    return scenes.reduce((sum, scene) => sum + (scene.duration || 0), 0);
  };

  const getRemainingDuration = () => {
    return totalDuration - getTotalAllocated();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast.error("Please sign in to create storyboards");
      return;
    }

    // Validate scene descriptions
    const emptyScenes = scenes.filter(s => !s.description.trim());
    if (emptyScenes.length > 0) {
      toast.error("Please fill in all scene descriptions");
      return;
    }

    // Check if all duration is allocated
    const remaining = getRemainingDuration();
    if (remaining !== 0) {
      if (remaining > 0) {
        toast.error(`Please allocate all remaining duration (${remaining.toFixed(1)}s) to scenes`);
      } else {
        toast.error(`Total scene duration exceeds the limit by ${Math.abs(remaining).toFixed(1)}s`);
      }
      return;
    }

    // Format scenes into a prompt
    const prompt = scenes.map((scene, index) => 
      `Scene ${index + 1} (${scene.duration}s): ${scene.description}`
    ).join("\n\n");

    setLoading(true);

    try {
      // Check credits (storyboards require 2 credits)
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.credits < 2) {
        toast.error("Insufficient credits (storyboards require 2 credits)");
        setLoading(false);
        return;
      }

      let imageUrl = null;

      // Upload reference images if provided
      if (imageFiles.length > 0) {
        const uploadedUrls: string[] = [];
        
        for (const file of imageFiles) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("video-inputs")
            .upload(fileName, file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue; // Skip this file but continue with others
          }

          const { data: { publicUrl } } = supabase.storage
            .from("video-inputs")
            .getPublicUrl(uploadData.path);

          uploadedUrls.push(publicUrl);
        }

        // Store multiple URLs as JSON string
        imageUrl = uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null;
      }

      // Create video record with storyboard model
      const { data: videoData, error: insertError } = await supabase
        .from("videos")
        .insert({
          user_id: session.user.id,
          model: "sora-2-pro-storyboard",
          prompt,
          aspect_ratio: aspectRatio,
          n_frames: totalDuration * 30,
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
            <div className="mb-6 px-6 py-4 bg-accent/10 border-2 border-accent rounded-lg">
              <p className="text-2xl font-bold font-serif text-accent mb-2">
                ⚠️ IMPORTANT: Storyboards is a Pro Feature
              </p>
              <p className="text-base text-muted-foreground">
                It uses Sora Pro model — for testing it uses 2 credits
              </p>
            </div>
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
                    <Label htmlFor="duration">Total Duration</Label>
                    <Select value={totalDuration.toString()} onValueChange={(v) => setTotalDuration(parseInt(v))}>
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

                <div className="space-y-2">
                  <Label htmlFor="images">Reference Images (Optional)</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setImageFiles(e.target.files ? Array.from(e.target.files) : [])}
                  />
                  <p className="text-sm text-muted-foreground">
                    Upload multiple reference images to guide the storyboard style
                  </p>
                  {imageFiles.length > 0 && (
                    <p className="text-sm font-medium text-accent">
                      {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg">Scenes (Total Duration: {totalDuration}s)</Label>
                    <span className={`text-sm font-medium ${getRemainingDuration() === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      Remaining: {getRemainingDuration().toFixed(1)}s
                    </span>
                  </div>

                  {scenes.map((scene, index) => (
                    <Card key={scene.id} className="border-2">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">Scene {index + 1}</h3>
                          {scenes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScene(scene.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <Textarea
                          placeholder="Describe this scene... who, where, what happens?"
                          value={scene.description}
                          onChange={(e) => updateScene(scene.id, 'description', e.target.value)}
                          required
                          rows={4}
                          className="resize-none"
                        />
                        
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max={totalDuration}
                            value={scene.duration || ''}
                            onChange={(e) => updateScene(scene.id, 'duration', parseFloat(e.target.value) || 0)}
                            className="w-24"
                            placeholder="0"
                          />
                          <span className="text-sm text-muted-foreground">seconds</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addScene}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Scene
                  </Button>

                  {getRemainingDuration() !== 0 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-sm text-orange-800 dark:text-orange-200">
                        ⚠️ Please allocate all remaining duration ({getRemainingDuration().toFixed(1)}s) to scenes before generating
                      </p>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading || getRemainingDuration() !== 0}>
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

      <Footer />
    </div>
  );
};

export default Storyboard;
