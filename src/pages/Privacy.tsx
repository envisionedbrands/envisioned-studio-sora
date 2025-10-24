import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Effective Date: October 24, 2025</p>
          
          <div className="prose prose-sm md:prose-base max-w-none space-y-8">
            <section>
              <p className="text-muted-foreground mb-4">
                <strong>Data Controller:</strong> Envisioned Studio, The Netherlands<br />
                <strong>Contact:</strong> <a href="mailto:hello@mariaines.co" className="text-primary hover:underline">hello@mariaines.co</a>
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">1. Data We Collect</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>Account data:</strong> name, email, and password</li>
                <li><strong>Usage data:</strong> prompts, credit balance, generation logs</li>
                <li><strong>Technical data:</strong> browser type, device, and IP (for security and analytics)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">2. How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>To operate the App (authentication, video generation, credits)</li>
                <li>To communicate about account or technical issues</li>
                <li>To analyze performance and improve service reliability</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">3. Third-Party Services</h2>
              <p className="text-foreground/90 mb-3">We rely on:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>Lovable / Supabase</strong> – hosting, authentication, and data storage</li>
                <li><strong>Sora</strong> – video and storyboard generation</li>
                <li><strong>Google Cloud</strong> – optional login and infrastructure services</li>
              </ul>
              <p className="text-foreground/90 mt-3">
                Each provider processes data under their respective privacy terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">4. Data Storage & Retention</h2>
              <p className="text-foreground/90">
                Data is securely stored in Lovable's Supabase Cloud within the EU. We retain data as long as your account remains active or as required by law.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">5. Data Rights (GDPR)</h2>
              <p className="text-foreground/90 mb-3">
                You have the right to access, correct, delete, or export your data. To exercise your rights, email <a href="mailto:hello@mariaines.co" className="text-primary hover:underline">hello@mariaines.co</a>.
              </p>
              <p className="text-foreground/90">
                You also have the right to lodge a complaint with the Dutch Data Protection Authority.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">6. Security</h2>
              <p className="text-foreground/90">
                We implement encryption, authentication, and restricted access to protect your data. No online system is entirely risk-free.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">7. Children</h2>
              <p className="text-foreground/90">
                This service is not intended for users under 16.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">8. Changes</h2>
              <p className="text-foreground/90">
                We may update this policy occasionally. The updated version will be posted on this page with a revised effective date.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
