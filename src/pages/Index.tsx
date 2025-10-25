import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Video, Zap } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ zIndex: 0 }}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        
        <div className="container mx-auto max-w-5xl text-center relative" style={{ zIndex: 1 }}>
          <div className="inline-block mb-6 px-4 py-2 bg-accent/10 rounded-full text-sm font-medium text-accent">
            {t('home.poweredBy')} {t('home.studioName')}
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
            <span className="text-gradient">{t('home.title')}</span>
          </h1>
          
          <p className="text-2xl md:text-3xl font-light text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
            {t('home.subtitle')}
          </p>

          <p className="text-lg md:text-xl text-muted-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed italic">
            {t('home.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="text-lg px-8 py-6 group"
            >
              {t('home.startCreating')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/library")}
              className="text-lg px-8 py-6"
            >
              {t('home.viewExamples')}
            </Button>
          </div>
        </div>
      </section>

      {/* Director Section */}
      <section className="py-16 px-6 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 whitespace-pre-line">
            {t('home.sectionTitle')}
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed whitespace-pre-line">
            {t('home.sectionSubtitle')}
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">{t('home.textToVideo')}</h3>
              <p className="text-muted-foreground leading-relaxed italic">
                {t('home.textToVideoDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">{t('home.imageToVideo')}</h3>
              <p className="text-muted-foreground leading-relaxed italic">
                {t('home.imageToVideoDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">{t('home.proQuality')}</h3>
              <p className="text-muted-foreground leading-relaxed italic">
                {t('home.proQualityDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visionaries Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-accent/5 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-8 whitespace-pre-line">
            {t('home.visionariesTitle')}
          </h2>
          <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
            {t('home.visionariesDesc')}
          </p>
          <p className="text-lg text-muted-foreground/80 mb-6 leading-relaxed">
            {t('home.visionariesSubDesc')}
          </p>
          <p className="text-xl font-medium text-foreground italic">
            {t('home.visionariesTagline')}
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 whitespace-pre-line">
            {t('home.readyTitle')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8 whitespace-pre-line leading-relaxed">
            {t('home.readyDesc')}
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6 group">
            {t('home.getStartedFree')}
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
