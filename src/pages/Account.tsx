import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Profile {
  name: string | null;
  email: string | null;
  tier: string;
  credits: number;
  created_at: string;
}

const Account = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session?.user?.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  if (!session || loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12">
            <h1 className="font-serif text-5xl font-bold mb-4">{t('account.title')}</h1>
            <p className="text-xl text-muted-foreground">
              {t('account.subtitle')}
            </p>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">{t('account.profileInfo')}</CardTitle>
                <CardDescription>{t('account.profileDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('account.name')}</span>
                  <span className="font-medium">{profile?.name || t('account.notSet')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('account.email')}</span>
                  <span className="font-medium">{profile?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t('account.memberSince')}</span>
                  <span className="font-medium">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">{t('account.creditsAndPlan')}</CardTitle>
                <CardDescription>{t('account.creditsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('account.currentPlan')}</p>
                    <Badge
                      variant={profile?.tier === "pro" ? "default" : "secondary"}
                      className="text-base px-3 py-1"
                    >
                      {profile?.tier === "pro" ? t('account.pro') : t('account.free')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">{t('account.availableCredits')}</p>
                    <p className={`text-3xl font-bold font-serif ${
                      (profile?.credits || 0) >= 5 ? "text-emerald-400" :
                      (profile?.credits || 0) >= 3 ? "text-yellow-400" :
                      "text-red-400"
                    }`}>
                      {profile?.credits || 0}
                    </p>
                  </div>
                </div>

                {profile?.tier === "free" && (
                  <div className="p-6 rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                    <div className="flex items-start gap-4">
                      <Sparkles className="w-6 h-6 text-accent shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-serif text-xl font-bold mb-2">{t('account.upgradeTitle')}</h3>
                        <p className="text-muted-foreground mb-4">
                          {t('account.upgradeDesc')}
                        </p>
                        <Button>{t('account.upgradeNow')}</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Account;
