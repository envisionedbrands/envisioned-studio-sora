import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Film, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

const Navigation = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

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
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-editorial hover:opacity-70">
          <Film className="w-6 h-6 text-accent" />
          <span className="font-serif text-xl font-bold">Envisioned Studio</span>
        </Link>

        <div className="flex items-center gap-6">
          {session ? (
            <>
              {credits !== null && (
                <div className="text-sm font-medium bg-accent/10 px-4 py-2 rounded-full">
                  {credits} Credits
                </div>
              )}
              <Link to="/create">
                <Button variant="ghost">Create</Button>
              </Link>
              <Link to="/library">
                <Button variant="ghost">Library</Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button variant="default">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
