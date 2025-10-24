import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Video, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (session) {
      navigate("/create");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            Envisioned Studio
            <br />
            <span className="text-gradient">AI Video Creation</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Editorial-grade motion imagery for modern creators.
            Transform your ideas into stunning videos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 group"
            >
              Start Creating
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/library")}
              className="text-lg px-8 py-6"
            >
              View Examples
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">Text to Video</h3>
              <p className="text-muted-foreground leading-relaxed">
                Transform your prompts into cinematic videos with advanced AI technology
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">Image to Video</h3>
              <p className="text-muted-foreground leading-relaxed">
                Bring your images to life with seamless motion and professional quality
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">Pro Quality</h3>
              <p className="text-muted-foreground leading-relaxed">
                Access premium models for editorial-grade results and watermark removal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Ready to create something amazing?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start with 2 free credits. No credit card required.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
            Get Started Free
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
