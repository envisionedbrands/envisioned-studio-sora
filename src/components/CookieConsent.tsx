import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-in slide-in-from-bottom duration-500">
      <Card className="max-w-4xl mx-auto border-2 shadow-2xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-serif text-xl md:text-2xl font-bold mb-2">
                🍪 Cookie Notice
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                We use essential cookies to operate our service, including authentication and video generation features. 
                By continuing to use this site, you consent to our use of cookies as described in our{" "}
                <Link to="/cookies" className="text-primary hover:underline font-medium">
                  Cookie Policy
                </Link>
                . We also comply with{" "}
                <Link to="/privacy" className="text-primary hover:underline font-medium">
                  GDPR data protection requirements
                </Link>
                .
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              className="shrink-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleAccept} className="flex-1 sm:flex-none">
              Accept All Cookies
            </Button>
            <Button onClick={handleDecline} variant="outline" className="flex-1 sm:flex-none">
              Essential Only
            </Button>
            <Button asChild variant="ghost" className="flex-1 sm:flex-none">
              <Link to="/cookies">Learn More</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Essential cookies are required for login, credits, and video generation. You can manage your preferences anytime in your browser settings.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;
