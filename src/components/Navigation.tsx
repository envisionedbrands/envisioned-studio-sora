import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, User, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navigation = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      .select("credits")
      .eq("id", session?.user?.id)
      .single();
    
    if (data) {
      setCredits(data.credits);
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
                <div className="text-sm font-medium bg-accent/10 px-3 lg:px-4 py-2 rounded-full">
                  {credits} Credits
                </div>
              )}
              <Link to="/create">
                <Button variant="ghost" size="sm">Create</Button>
              </Link>
              <Link to="/storyboard">
                <Button variant="ghost" size="sm" className="hidden lg:inline-flex">
                  Storyboard (Coming Soon)
                </Button>
              </Link>
              <Link to="/library">
                <Button variant="ghost" size="sm">Library</Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm">Sign In</Button>
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
                  {credits !== null && (
                    <div className="text-sm font-medium bg-accent/10 px-4 py-2 rounded-full text-center">
                      {credits} Credits
                    </div>
                  )}
                  <Link to="/create" onClick={handleNavClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      Create
                    </Button>
                  </Link>
                  <Link to="/storyboard" onClick={handleNavClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      Storyboard (Coming Soon)
                    </Button>
                  </Link>
                  <Link to="/library" onClick={handleNavClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      Library
                    </Button>
                  </Link>
                  <Link to="/account" onClick={handleNavClick}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="w-5 h-5 mr-2" />
                      Account
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={handleNavClick}>
                  <Button variant="default" className="w-full">Sign In</Button>
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
