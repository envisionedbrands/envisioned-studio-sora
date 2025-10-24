import { useState, useEffect } from "react";
import { Search, BookmarkCheck, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";

interface SavedPrompt {
  id: string;
  prompt: string;
  title: string | null;
  created_at: string;
  source_video_id: string | null;
}

interface PromptLibrarySidebarProps {
  userId: string;
  onSelectPrompt: (prompt: string) => void;
  onDeletePrompt: () => void;
}

export function PromptLibrarySidebar({ userId, onSelectPrompt, onDeletePrompt }: PromptLibrarySidebarProps) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrompts();
  }, [userId]);

  const fetchPrompts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_prompts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching prompts:", error);
      toast.error("Failed to load saved prompts");
    } else {
      setPrompts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("saved_prompts")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete prompt");
    } else {
      toast.success("Prompt deleted");
      fetchPrompts();
      onDeletePrompt();
    }
  };

  const filteredPrompts = prompts.filter((p) =>
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar className="border-r" collapsible="offcanvas">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <BookmarkCheck className="w-5 h-5" />
          <h2 className="font-semibold">Prompt Library</h2>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">
            {filteredPrompts.length} {filteredPrompts.length === 1 ? "Prompt" : "Prompts"}
          </SidebarGroupLabel>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-220px)]">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Loading prompts...
                </div>
              ) : filteredPrompts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  {searchQuery ? "No prompts found" : "No saved prompts yet"}
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {filteredPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <p className="text-sm line-clamp-3 mb-2">
                        {prompt.prompt}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onSelectPrompt(prompt.prompt)}
                          className="flex-1 text-xs"
                        >
                          Use Prompt
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(prompt.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(prompt.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
