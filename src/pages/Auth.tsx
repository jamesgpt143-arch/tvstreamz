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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh Effect */}
      <div className="absolute inset-0 bg-mesh opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full animate-float" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />

      <Card className="w-full max-w-lg glass-card-heavy border-white/5 rounded-[3rem] shadow-2xl relative z-10 animate-reveal overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        
        <CardHeader className="text-center pt-12 pb-8">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse-slow" />
              {needsProfile ? (
                <div className="w-20 h-20 rounded-[2rem] glass-card flex items-center justify-center border-white/10 group">
                  <UserCircle className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-[2rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 transition-transform hover:scale-105 active:scale-95 group">
                  <Play className="h-10 w-10 text-black fill-black transition-transform group-hover:scale-110" />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] drop-shadow-glow-orange">Enterprise Core v3</p>
              <h2 className="text-4xl font-black text-white tracking-tighter italic">
                {needsProfile ? 'IDENTITY <span className="text-primary not-italic">SYNC</span>' : 'TV<span className="text-primary not-italic">STREAMZ</span>'}
              </h2>
            </div>
          </div>

          <CardTitle className="text-white text-xl font-black uppercase tracking-tight">
            {needsProfile ? 'Finalize Profile' : showSignedInState ? 'Account Verified' : 'Access Gateway'}
          </CardTitle>
          <CardDescription className="text-zinc-500 font-medium tracking-tight mt-2">
            {needsProfile
              ? 'Synchronize your handle with our broadcast network.'
              : showSignedInState
                ? 'Your session is currently active and secure.'
                : 'Enter your credentials to initiate stream access.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-12">
          {showSignedInState ? (
            <div className="space-y-6">
              <div className="rounded-3xl glass-card border-white/5 p-6 bg-white/[0.02]">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">IDENTIFIED AS</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-black text-black">
                    {session?.user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <p className="break-all text-sm font-black text-white tracking-tight">
                    {session?.user?.email || 'Authenticated User'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <Button type="button" className="h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95" onClick={handleSignOut} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />}
                  Deauthorize Session
                </Button>

                <Button type="button" className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" onClick={() => navigate("/")} disabled={loading}>
                  Enter Platform
                </Button>
              </div>
            </div>
          ) : needsProfile ? (
            <form onSubmit={handleProfileSetup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Broadcast Handle</Label>
                <Input
                  id="username"
                  placeholder="CoolWatcher99"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all px-6 text-white font-bold"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Visual ID (URL)</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  placeholder="https://example.com/id.jpg"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all px-6 text-white font-bold"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95 mt-4" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Confirm Protocol
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Digital Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="access@tvstreamz.io"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all px-6 text-white font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Security Key</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all px-6 text-white font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {isRegistering ? "Register ID" : "Verify Integrity"}
                </Button>
              </div>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-[11px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors duration-300"
                >
                  {isRegistering
                    ? "Existing user? Switch to Access"
                    : "No digital ID? Create one now"}
                </button>
              </div>
            </form>
          )}

          {!showSignedInState && (
            <div className="mt-10 text-center">
              <button 
                onClick={() => navigate("/")}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Abort & Return
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
