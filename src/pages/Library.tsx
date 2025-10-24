import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Copy, BookmarkPlus, Bookmark, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Video {
  id: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  status: string;
  result_url: string | null;
  created_at: string;
  n_frames: number;
  fail_reason: string | null;
}

const Library = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<{ prompt: string; videoId: string } | null>(null);
  const [savedPromptIds, setSavedPromptIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (session?.user?.id) {
      fetchVideos();
      fetchSavedPrompts();
      
      // Set up realtime subscription for video updates
      const channel = supabase
        .channel('video-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'videos',
            filter: `user_id=eq.${session.user.id}`
          },
          (payload) => {
            console.log('Video update received:', payload);
            fetchVideos();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  const fetchSavedPrompts = async () => {
    const { data, error } = await supabase
      .from("saved_prompts")
      .select("source_video_id")
      .eq("user_id", session?.user?.id);

    if (!error && data) {
      setSavedPromptIds(new Set(data.map(p => p.source_video_id).filter(Boolean)));
    }
  };

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("user_id", session?.user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("videos").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete video");
    } else {
      toast.success("Video deleted");
      fetchVideos();
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleSavePrompt = async (videoId: string, prompt: string) => {
    const isSaved = savedPromptIds.has(videoId);

    if (isSaved) {
      // Remove from saved prompts
      const { error } = await supabase
        .from("saved_prompts")
        .delete()
        .eq("source_video_id", videoId)
        .eq("user_id", session?.user?.id);

      if (error) {
        toast.error("Failed to remove prompt");
      } else {
        toast.success("Prompt removed from library");
        fetchSavedPrompts();
      }
    } else {
      // Save prompt
      const { error } = await supabase
        .from("saved_prompts")
        .insert({
          user_id: session?.user?.id!,
          prompt,
          source_video_id: videoId,
          title: prompt.slice(0, 100),
        });

      if (error) {
        toast.error("Failed to save prompt");
      } else {
        toast.success("Prompt saved to library");
        fetchSavedPrompts();
      }
    }
  };

  const handleRemix = (prompt: string) => {
    // Navigate to create page with the prompt pre-filled
    navigate("/create", { state: { prompt } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "fail":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12">
            <h1 className="font-serif text-5xl font-bold mb-4">Your Library</h1>
            <p className="text-xl text-muted-foreground">
              All your created videos in one place
            </p>
            <p className="mt-6 text-sm font-bold font-mono text-muted-foreground">
              Video rendering takes a while, don't worry it will appear here once ready.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-6">
                No videos yet — create your first cinematic masterpiece.
              </p>
              <Button onClick={() => navigate("/create")}>Create Video</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {video.result_url && video.status === "success" ? (
                        <video
                          src={video.result_url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Badge className={getStatusColor(video.status)}>
                            {video.status.toUpperCase()}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <p 
                          className="text-sm line-clamp-2 flex-1 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => setSelectedPrompt({ prompt: video.prompt, videoId: video.id })}
                        >
                          {video.prompt}
                        </p>
                        <Badge variant="outline" className="shrink-0">
                          {video.aspect_ratio}
                        </Badge>
                      </div>

                      {video.status === "fail" && video.fail_reason && (
                        <div className="text-xs text-red-600 bg-red-500/10 p-2 rounded border border-red-500/20">
                          {video.fail_reason}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        {video.model} • {Math.round(video.n_frames / 30)}s
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSavePrompt(video.id, video.prompt)}
                          className="flex-1"
                        >
                          {savedPromptIds.has(video.id) ? (
                            <><Bookmark className="w-4 h-4 mr-1 fill-current" /> Saved</>
                          ) : (
                            <><BookmarkPlus className="w-4 h-4 mr-1" /> Save</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemix(video.prompt)}
                          className="flex-1"
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Remix
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        {video.status === "success" && video.result_url && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(video.result_url!)}
                              className="flex-1"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="flex-1"
                            >
                              <a 
                                href={video.result_url} 
                                download={`Envisioned Studio-${video.prompt.slice(0, 50).replace(/[^a-z0-9]/gi, '-')}.mp4`}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </a>
                            </Button>
                          </>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className={video.status === "success" ? "" : "flex-1"}
                            >
                              <Trash2 className="w-4 h-4" />
                              {video.status !== "success" && <span className="ml-1">Delete</span>}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete video?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(video.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Full Prompt</DialogTitle>
            <DialogDescription className="sr-only">
              View the complete prompt text
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{selectedPrompt?.prompt}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedPrompt) {
                    handleSavePrompt(selectedPrompt.videoId, selectedPrompt.prompt);
                  }
                }}
                className="flex-1"
              >
                {selectedPrompt && savedPromptIds.has(selectedPrompt.videoId) ? (
                  <><Bookmark className="w-4 h-4 mr-2 fill-current" /> Saved to Library</>
                ) : (
                  <><BookmarkPlus className="w-4 h-4 mr-2" /> Save to Library</>
                )}
              </Button>
              <Button
                onClick={() => {
                  if (selectedPrompt) {
                    handleRemix(selectedPrompt.prompt);
                    setSelectedPrompt(null);
                  }
                }}
                className="flex-1"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Remix
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Library;
