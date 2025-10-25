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
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-block mb-6 px-4 py-2 bg-accent/10 rounded-full text-sm font-medium text-accent">
            {t('home.poweredBy')}
          </div>
          
          <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
            {t('home.title')}
            <br />
            <span className="text-gradient">{t('home.subtitle')}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
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

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Video className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">{t('home.textToVideo')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.textToVideoDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">{t('home.imageToVideo')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.imageToVideoDesc')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-3">{t('home.proQuality')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('home.proQualityDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            {t('home.readyTitle')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('home.readyDesc')}
          </p>
          <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
            {t('home.getStartedFree')}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
