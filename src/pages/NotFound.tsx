import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <h1 className="font-serif text-9xl font-bold mb-4 text-muted-foreground">404</h1>
          <h2 className="font-serif text-4xl font-bold mb-4">{t('notFound.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('notFound.description')}
          </p>
          <Button size="lg" asChild>
            <Link to="/">
              <Home className="mr-2 w-5 h-5" />
              {t('notFound.backHome')}
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
