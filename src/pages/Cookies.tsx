import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Cookies = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-5xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Effective Date: October 24, 2025</p>
          
          <div className="prose prose-sm md:prose-base max-w-none space-y-8">
            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">1. What Cookies We Use</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>Essential cookies</strong> – required for login, credits, and video generation (Supabase authentication).</li>
                <li><strong>Functional cookies</strong> – remember user preferences.</li>
                <li><strong>Optional cookies</strong> – analytics or third-party integrations (only if you add them later).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">2. How We Use Cookies</h2>
              <p className="text-foreground/90">
                Cookies help operate and secure the App, analyze usage, and improve user experience.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">3. Managing Cookies</h2>
              <p className="text-foreground/90">
                You can clear or disable cookies anytime in your browser settings. Doing so may limit some site functions.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">4. Third-Party Cookies</h2>
              <p className="text-foreground/90">
                Third-party tools like Supabase or Sora may use cookies under their respective privacy policies.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">5. Consent</h2>
              <p className="text-foreground/90">
                By continuing to use this site, you consent to our use of cookies as described here.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cookies;
