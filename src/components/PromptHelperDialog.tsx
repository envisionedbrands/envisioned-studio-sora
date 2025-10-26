import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Send, Check, Trash2, Mic, MicOff, Image as ImageIcon, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type MessageContent = string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>;

interface Message {
  role: "user" | "assistant";
  content: MessageContent;
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
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string }>>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Images must be under 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImages((prev) => [
          ...prev,
          { url: reader.result as string, name: file.name },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!input.trim() && uploadedImages.length === 0) || isLoading) return;

    let messageContent: MessageContent;
    
    if (uploadedImages.length > 0) {
      const contentParts: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [];
      
      if (input.trim()) {
        contentParts.push({ type: "text", text: input });
      }
      
      uploadedImages.forEach((img) => {
        contentParts.push({
          type: "image_url",
          image_url: { url: img.url },
        });
      });
      
      messageContent = contentParts;
    } else {
      messageContent = input;
    }

    const userMessage: Message = { role: "user", content: messageContent };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setUploadedImages([]);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Speak your prompt...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio },
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

        setInput(prev => prev + (prev ? " " : "") + data.text);
        toast({
          title: "Transcribed!",
          description: "Your voice has been converted to text",
        });
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Studio's Creative Director
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
                      {typeof message.content === "string" ? (
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      ) : (
                        <div className="space-y-2">
                          {message.content.map((part, partIndex) => (
                            <div key={partIndex}>
                              {part.type === "text" && part.text && (
                                <p className="whitespace-pre-wrap text-sm">{part.text}</p>
                              )}
                              {part.type === "image_url" && part.image_url && (
                                <img
                                  src={part.image_url.url}
                                  alt="Uploaded"
                                  className="max-w-full rounded-md mt-2"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {message.role === "assistant" && typeof message.content === "string" && (
                        <div className="flex gap-2 mt-3">
                          {mode === "single" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyPrompt(message.content as string)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Apply
                            </Button>
                          )}
                          {mode === "scenes" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSplitIntoScenes(message.content as string)}
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
            <div className="flex-1 space-y-2">
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Describe what you want to create or upload images..."
                className="min-h-[80px] resize-y"
                disabled={isLoading || isRecording}
              />
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isRecording}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Upload Images
                </Button>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading || isTranscribing}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {isTranscribing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Transcribing...
                    </>
                  ) : isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Record Voice
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={(!input.trim() && uploadedImages.length === 0) || isLoading || isRecording}
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
