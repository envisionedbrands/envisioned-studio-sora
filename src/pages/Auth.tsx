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

const Auth = () => {
  const navigate = useNavigate();
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

    // Validate invite code
    const { data: isValid, error: codeError } = await supabase.rpc('use_invite_code', {
      code_text: validation.data.inviteCode
    });

    if (codeError || !isValid) {
      setLoading(false);
      toast.error("Invalid or expired invite code. Please check your code and try again.");
      return;
    }

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

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Redirecting...");
    }
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
      toast.success("Welcome back!");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Google sign-in clicked, invite code:", googleInviteCode);
      
      // Validate invite code
      const validation = signUpSchema.shape.inviteCode.safeParse(googleInviteCode);
      if (!validation.success) {
        console.error("Validation failed:", validation.error);
        toast.error(validation.error.errors[0].message);
        return;
      }

      console.log("Validation passed, checking invite code...");
      
      // Check if invite code is valid
      const { data: isValid, error: codeError } = await supabase.rpc('use_invite_code', {
        code_text: googleInviteCode.toUpperCase()
      });

      console.log("Invite code check result:", { isValid, codeError });

      if (codeError || !isValid) {
        toast.error("Invalid or expired invite code");
        return;
      }

      console.log("Starting OAuth flow...");
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/create`,
        },
      });

      console.log("OAuth result:", { error });

      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error in handleGoogleSignIn:", error);
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
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
                  <CardDescription>Sign in to continue creating</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-invite">Invite Code</Label>
                    <Input
                      id="google-invite"
                      placeholder="Enter your invite code"
                      value={googleInviteCode}
                      onChange={(e) => setGoogleInviteCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading || !googleInviteCode}
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Create Account</CardTitle>
                  <CardDescription>Start with 5 free credits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google-invite-signup">Invite Code</Label>
                    <Input
                      id="google-invite-signup"
                      placeholder="Enter your invite code"
                      value={googleInviteCode}
                      onChange={(e) => setGoogleInviteCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loading || !googleInviteCode}
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Continue with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
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
                      <Label htmlFor="invite-code">Invite Code</Label>
                      <Input
                        id="invite-code"
                        type="text"
                        placeholder="Enter your invite code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
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
