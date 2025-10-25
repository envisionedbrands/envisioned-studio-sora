import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, User, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getCreditColorClass = (credits: number) => {
    if (credits >= 5) return "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30";
    if (credits >= 3) return "bg-yellow-500/20 text-yellow-400 border border-yellow-400/30";
    return "bg-red-500/20 text-red-400 border border-red-400/30";
  };

  const isActivePath = (path: string) => location.pathname === path;

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

  useEffect(() => {
    if (session?.user?.id) {
      fetchCredits();
    }
  }, [session]);

  const fetchCredits = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("credits, tier")
      .eq("id", session?.user?.id)
      .single();
    
    if (data) {
      setCredits(data.credits);
      setTier(data.tier);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo - Responsive */}
        <Link to="/" className="flex items-center gap-2 transition-editorial hover:opacity-70">
          <Film className="w-6 h-6 text-accent" />
          <span className="font-serif text-base sm:text-lg md:text-xl font-bold hidden xs:inline">
            Envisioned Studio
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {session ? (
            <>
              {credits !== null && (
                <div className={`text-sm font-medium px-3 lg:px-4 py-2 rounded-full ${getCreditColorClass(credits)}`}>
                  {credits} {t('nav.credits')}
                </div>
              )}
              <LanguageSelector />
              <Link to="/create">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={isActivePath("/create") ? "bg-accent text-accent-foreground" : ""}
                >
                  {t('nav.create')}
                </Button>
              </Link>
              <Link to="/create-pro">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={isActivePath("/create-pro") ? "bg-accent text-accent-foreground" : ""}
                >
                  {t('nav.createPro')}
                </Button>
              </Link>
              <Link to="/storyboard">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`hidden lg:inline-flex ${isActivePath("/storyboard") ? "bg-accent text-accent-foreground" : ""}`}
                >
                  {t('nav.storyboard')}
                </Button>
              </Link>
              <Link to="/library">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={isActivePath("/library") ? "bg-accent text-accent-foreground" : ""}
                >
                  {t('nav.library')}
                </Button>
              </Link>
              <Link to="/failed-videos">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={isActivePath("/failed-videos") ? "bg-accent text-accent-foreground" : ""}
                >
                  {t('nav.help')}
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">{t('nav.signIn')}</Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <div className="flex flex-col gap-6 mt-8">
              {session ? (
                <>
                  <LanguageSelector />
                  {credits !== null && (
                    <div className={`text-sm font-medium px-4 py-2 rounded-full text-center ${getCreditColorClass(credits)}`}>
                      {credits} {t('nav.credits')}
                    </div>
                  )}
                  <Link to="/create" onClick={handleNavClick}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActivePath("/create") ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {t('nav.create')}
                    </Button>
                  </Link>
                  <Link to="/create-pro" onClick={handleNavClick}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActivePath("/create-pro") ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {t('nav.createPro')}
                    </Button>
                  </Link>
                  <Link to="/storyboard" onClick={handleNavClick}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActivePath("/storyboard") ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {t('nav.storyboard')}
                    </Button>
                  </Link>
                  <Link to="/library" onClick={handleNavClick}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActivePath("/library") ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {t('nav.library')}
                    </Button>
                  </Link>
                  <Link to="/failed-videos" onClick={handleNavClick}>
                    <Button 
                      variant="ghost" 
                      className={`w-full justify-start ${isActivePath("/failed-videos") ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {t('nav.help')}
                    </Button>
                  </Link>
                  <Link to="/account" onClick={handleNavClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="w-5 h-5 mr-2" />
                      {t('nav.account')}
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    {t('nav.logout')}
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={handleNavClick}>
                  <Button variant="default" className="w-full">{t('nav.signIn')}</Button>
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navigation;
