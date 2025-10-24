import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-serif text-5xl font-bold mb-4">Terms of Use</h1>
          <p className="text-muted-foreground mb-8">Effective Date: October 24, 2025</p>
          
          <div className="prose prose-sm md:prose-base max-w-none space-y-8">
            <section>
              <p className="text-muted-foreground mb-4">
                <strong>Operator:</strong> Envisioned Studio<br />
                <strong>Website:</strong> <a href="https://envisionedstudio.co" className="text-primary hover:underline">https://envisionedstudio.co</a><br />
                <strong>Contact:</strong> <a href="mailto:hello@mariaines.co" className="text-primary hover:underline">hello@mariaines.co</a>
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">1. Acceptance of Terms</h2>
              <p className="text-foreground/90">
                By accessing or using this website and its related services ("the App"), you agree to these Terms of Use. If you do not agree, do not use the App.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">2. Description of Service</h2>
              <p className="text-foreground/90">
                The App provides AI-powered creative tools and video generation services using third-party APIs (including Sora). Access may be limited to beta users through invite codes and/or credit-based systems.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">3. Beta Access</h2>
              <p className="text-foreground/90">
                During beta testing, features are experimental and may change or fail without notice. Video generations may fail due to Sora's internal moderation, not the App itself.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">4. Accounts & Access</h2>
              <p className="text-foreground/90">
                You must provide accurate information and maintain the confidentiality of your account. You are responsible for all activities under your account.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">5. Credits & Payments</h2>
              <p className="text-foreground/90">
                Each video or storyboard generation deducts credits as indicated in the App. Credits are non-refundable, including when creations fail due to third-party moderation (e.g., Sora content policy).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">6. Intellectual Property</h2>
              <p className="text-foreground/90">
                You retain ownership of your prompts, uploads, and generated content to the extent allowed by the third-party providers' terms (e.g., Sora). You grant Envisioned Studio a limited license to store and process your content for functionality and troubleshooting.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">7. Prohibited Use</h2>
              <p className="text-foreground/90">
                You may not use the App to generate or upload content that is illegal, harmful, infringing, or violates others' rights.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">8. Limitation of Liability</h2>
              <p className="text-foreground/90">
                The App is provided "as is." Envisioned Studio disclaims any warranties and is not liable for loss or damages arising from use, inaccessibility, or third-party service errors.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">9. Modifications</h2>
              <p className="text-foreground/90">
                We may update these Terms as the App evolves. Continued use constitutes acceptance of updated Terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-3xl font-bold mb-3">10. Governing Law</h2>
              <p className="text-foreground/90">
                These Terms are governed by Dutch law, and disputes will be handled in the Netherlands.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
