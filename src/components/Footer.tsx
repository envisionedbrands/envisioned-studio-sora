import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <h3 className="font-serif text-xl font-bold mb-3">{t('footer.company')}</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {t('footer.companyDesc')}
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-3">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('footer.cookies')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3">{t('footer.contact')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="mailto:hello@mariaines.co" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  hello@mariaines.co
                </a>
              </li>
              <li>
                <a 
                  href="https://envisionedstudio.co" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  envisionedstudio.co
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/40 mt-8 pt-6">
          <p className="text-sm text-muted-foreground text-center">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
