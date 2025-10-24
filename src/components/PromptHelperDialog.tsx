import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, Check, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PromptHelperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyPrompt: (prompt: string) => void;
  mode?: "single" | "scenes";
  onApplyScenes?: (scenes: Array<{ description: string; duration: number }>) => void;
}

const PromptHelperDialog = ({ 
  open, 
  onOpenChange, 
  onApplyPrompt,
  mode = "single",
  onApplyScenes
}: PromptHelperDialogProps) => {
  const STORAGE_KEY = `prompt-helper-${mode}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load conversation history:", e);
      }
    }
  }, [STORAGE_KEY]);

  // Save conversation history to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, STORAGE_KEY]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Cleared",
      description: "Conversation history has been cleared",
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("improve-prompt", {
        body: { messages: newMessages },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.choices[0].message.content,
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPrompt = (prompt: string) => {
    onApplyPrompt(prompt);
    toast({
      title: "Applied!",
      description: "Prompt has been added to your form",
    });
  };

  const handleSplitIntoScenes = async (prompt: string) => {
    if (!onApplyScenes) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("split-prompt", {
        body: { prompt },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      onApplyScenes(data.scenes);
      onOpenChange(false);
      toast({
        title: "Scenes created!",
        description: `Split into ${data.scenes.length} scenes`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to split prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Prompt Helper
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-8"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Describe what you want to create</p>
                  <p className="text-sm mt-2">
                    I'll help you craft the perfect prompt
                  </p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      {message.role === "assistant" && (
                        <div className="flex gap-2 mt-3">
                          {mode === "single" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyPrompt(message.content)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Apply
                            </Button>
                          )}
                          {mode === "scenes" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSplitIntoScenes(message.content)}
                              disabled={isLoading}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Split into Scenes
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Describe what you want to create..."
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="self-end"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromptHelperDialog;
