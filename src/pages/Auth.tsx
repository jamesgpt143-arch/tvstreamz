import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, UserCircle } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSetupMode = searchParams.get('setup') === 'true';

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [needsProfile, setNeedsProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const checkUserAndProfile = async (currentSession: any) => {
      setSession(currentSession);

      if (!currentSession?.user) {
        setNeedsProfile(false);
        setCheckingAuth(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentSession.user.id)
        .maybeSingle();

      setNeedsProfile(!profile || isSetupMode);
      setCheckingAuth(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      void checkUserAndProfile(currentSession);
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      void checkUserAndProfile(session);
    });

    return () => subscription.unsubscribe();
  }, [isSetupMode]);

  const showSignedInState = Boolean(session?.user && !needsProfile && !isSetupMode);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "You are now logged in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Successfully signed in." });
      }
    } catch (error: any) {
      toast({
        title: isRegistering ? "Sign up failed" : "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !session?.user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: session.user.id,
            username: username.trim(),
            avatar_url: avatarUrl.trim() || null,
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      toast({ title: "Profile Ready!", description: "You can now chat." });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setEmail("");
      setPassword("");
      setUsername("");
      setAvatarUrl("");

      toast({ title: "Signed out", description: "You can now sign in with a different account." });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {needsProfile ? (
              <UserCircle className="h-10 w-10 text-primary" />
            ) : (
              <Play className="h-8 w-8 text-primary fill-primary" />
            )}
            <span className="text-2xl font-bold text-foreground">
              {needsProfile ? 'Almost Done!' : 'TVStreamz'}
            </span>
          </div>
          <CardTitle className="text-foreground">
            {needsProfile ? 'Set Up Your Profile' : showSignedInState ? 'Already signed in' : 'Welcome'}
          </CardTitle>
          <CardDescription>
            {needsProfile
              ? 'Choose a username to display in the live chat.'
              : showSignedInState
                ? 'Sign out below if you want to switch to a different account.'
                : 'Sign in or create an account to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showSignedInState ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current account</p>
                <p className="mt-1 break-all text-sm font-medium text-foreground">
                  {session?.user?.email || 'Signed in user'}
                </p>
              </div>

              <Button type="button" className="w-full" onClick={handleSignOut} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign out to switch account
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/")} disabled={loading}>
                Continue to Home
              </Button>
            </div>
          ) : needsProfile ? (
            <form onSubmit={handleProfileSetup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username (Required)</Label>
                <Input
                  id="username"
                  placeholder="CoolWatcher99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/my-pic.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Link to your profile picture.</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Setup
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegistering ? "Create Account" : "Sign In"}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sm text-primary hover:underline"
                >
                  {isRegistering
                    ? "Already have an account? Sign in"
                    : "Need an account? Sign up for free"}
                </button>
              </div>
            </form>
          )}

          {!showSignedInState && (
            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
