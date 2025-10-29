import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Session } from "@supabase/supabase-js";
import { signUpSchema, signInSchema } from "@/lib/validations";
import { Separator } from "@/components/ui/separator";
import { Chrome } from "lucide-react";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [googleInviteCode, setGoogleInviteCode] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        navigate("/create");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        navigate("/create");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    const validation = signUpSchema.safeParse({ name, email, password, inviteCode });
    if (!validation.success) {
      setLoading(false);
      toast.error(validation.error.errors[0].message);
      return;
    }

    // Check if user limit is reached
    const { data: canSignUp, error: limitError } = await supabase.rpc('check_user_limit');

    if (limitError || !canSignUp) {
      setLoading(false);
      toast.error("Registration is currently closed. The maximum number of users has been reached.");
      return;
    }

    // Check invite code validity WITHOUT consuming it
    try {
      const { data: checkResult, error: codeError } = await supabase.rpc('check_invite_code', {
        code_text: validation.data.inviteCode
      });

      if (codeError) {
        setLoading(false);
        toast.error("An error occurred validating the invite code.");
        return;
      }

      const result = checkResult as { valid: boolean; error?: string };
      if (!result.valid) {
        setLoading(false);
        toast.error(result.error || "Invalid or expired invite code. Please check your code and try again.");
        return;
      }
    } catch (error: any) {
      setLoading(false);
      toast.error("An error occurred validating the invite code.");
      return;
    }

    // Create the user account
    const { error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        data: {
          name: validation.data.name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Only consume the invite code AFTER successful signup
    try {
      const { data: consumed, error: consumeError } = await supabase.rpc('consume_invite_code', {
        code_text: validation.data.inviteCode
      });

      if (consumeError || !consumed) {
        console.error("Failed to consume invite code after signup:", consumeError);
        // Don't show error to user since account was created successfully
      }
    } catch (error) {
      console.error("Failed to consume invite code after signup:", error);
      // Don't show error to user since account was created successfully
    }

    setLoading(false);
    toast.success(t('common.success.accountCreated'));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate inputs
    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      setLoading(false);
      toast.error(validation.error.errors[0].message);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('common.success.welcomeBack'));
    }
  };

  const handleGoogleSignIn = async (requireInviteCode: boolean = false) => {
    try {
      // Only validate invite code for sign-ups
      if (requireInviteCode) {
        const validation = signUpSchema.shape.inviteCode.safeParse(googleInviteCode);
        if (!validation.success) {
          toast.error(validation.error.errors[0].message);
          return;
        }

        try {
          const { data: checkResult, error: codeError } = await supabase.rpc('check_invite_code', {
            code_text: googleInviteCode.toUpperCase()
          });

          if (codeError) {
            toast.error("An error occurred validating the invite code.");
            return;
          }

          const result = checkResult as { valid: boolean; error?: string };
          if (!result.valid) {
            toast.error(result.error || "Invalid or expired invite code");
            return;
          }

          // Note: For OAuth, we validate but consume the code before knowing if signup succeeds
          // This is a known limitation - OAuth redirects before we can confirm account creation
          const { data: consumed } = await supabase.rpc('consume_invite_code', {
            code_text: googleInviteCode.toUpperCase()
          });

          if (!consumed) {
            toast.error("Failed to use invite code");
            return;
          }
        } catch (error: any) {
          toast.error("An error occurred validating the invite code.");
          return;
        }
      }

      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/create`,
        },
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      setLoading(false);
    }
  };


  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-md">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="signin">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="signup">{t('auth.signUp')}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">{t('auth.welcomeBack')}</CardTitle>
                  <CardDescription>{t('auth.signInDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleGoogleSignIn(false)}
                    disabled={loading}
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    {t('auth.continueGoogle')}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('auth.orContinueEmail')}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('auth.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('auth.password')}</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('auth.signingIn') : t('auth.signIn')}
                    </Button>
                  </form>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">{t('auth.createAccount')}</CardTitle>
                  <CardDescription>{t('auth.signUpDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-invite-signup">{t('auth.inviteCode')}</Label>
                    <Input
                      id="google-invite-signup"
                      placeholder={t('auth.inviteCodePlaceholder')}
                      value={googleInviteCode}
                      onChange={(e) => setGoogleInviteCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleGoogleSignIn(true)}
                    disabled={loading || !googleInviteCode}
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    {t('auth.continueGoogle')}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('auth.orContinueEmail')}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('auth.name')}</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={t('auth.namePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('auth.email')}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('auth.password')}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-code">{t('auth.inviteCode')}</Label>
                      <Input
                        id="invite-code"
                        type="text"
                        placeholder={t('auth.inviteCodePlaceholder')}
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                    </Button>
                  </form>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
