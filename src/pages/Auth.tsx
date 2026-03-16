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
  
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Profile setup state
  const [needsProfile, setNeedsProfile] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const checkUserAndProfile = async (currentSession: any) => {
      setSession(currentSession);
      if (currentSession?.user) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();

        if (!profile || isSetupMode) {
          setNeedsProfile(true);
        } else {
          navigate("/");
        }
      }
      setCheckingAuth(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserAndProfile(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      checkUserAndProfile(currentSession);
    });

    return () => subscription.unsubscribe();
  }, [navigate, isSetupMode]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        .upsert({
          user_id: session.user.id,
          username: username.trim(),
          avatar_url: avatarUrl.trim() || null
        }, { onConflict: 'user_id' });

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
            {needsProfile ? 'Set Up Your Profile' : 'Welcome'}
          </CardTitle>
          <CardDescription>
            {needsProfile 
              ? 'Choose a username to display in the live chat.' 
              : 'Sign in or create an account to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          {needsProfile ? (
            /* PROFILE SETUP FORM */
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
            /* EMAIL / PASSWORD FORM */
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

          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
