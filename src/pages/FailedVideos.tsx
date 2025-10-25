import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const FailedVideos = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16">
        <article className="max-w-4xl mx-auto prose prose-invert">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8 text-foreground">
            {t('failedVideos.title')}
          </h1>

          {/* Content-Related Policy Violations */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 text-foreground">
              {t('failedVideos.contentPolicy')}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.copyrightedTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.copyrightedDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.realPeopleTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.realPeopleDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.violenceTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.violenceDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.nsfwTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.nsfwDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.politicalTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.politicalDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.falsePositivesTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.falsePositivesDesc')}
                </p>
              </div>
            </div>
          </section>

          {/* Prompt Formatting and Input Errors */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 text-foreground">
              {t('failedVideos.promptFormatting')}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.complexPromptsTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.complexPromptsDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.unsupportedSyntaxTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.unsupportedSyntaxDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.imageInputTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.imageInputDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.durationMismatchTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.durationMismatchDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.plainTextTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.plainTextDesc')}
                </p>
              </div>
            </div>
          </section>

          {/* Technical Limitations */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 text-foreground">
              {t('failedVideos.technicalLimitations')}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.lengthLimitsTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.lengthLimitsDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.complexScenesTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.complexScenesDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.unsupportedFeaturesTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.unsupportedFeaturesDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.hardwareTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.hardwareDesc')}
                </p>
              </div>
            </div>
          </section>

          {/* Platform & Usage Restrictions */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 text-foreground">
              {t('failedVideos.platformRestrictions')}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.accessTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.accessDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.quotaTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.quotaDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.betaFeaturesTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.betaFeaturesDesc')}
                </p>
              </div>
            </div>
          </section>

          {/* API Errors and System Issues */}
          <section className="mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold mb-6 text-foreground">
              {t('failedVideos.apiErrors')}
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.moderationFlagsTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.moderationFlagsDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.serverErrorsTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.serverErrorsDesc')}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {t('failedVideos.apiChangesTitle')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('failedVideos.apiChangesDesc')}
                </p>
              </div>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default FailedVideos;
