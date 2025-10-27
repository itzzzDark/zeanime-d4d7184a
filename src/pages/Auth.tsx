import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type Step = 'email' | 'otp' | 'password';

export default function Auth() {
  const { signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [authType, setAuthType] = useState<'signup' | 'signin'>('signin');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: { email, type: authType },
      });

      if (error) throw error;

      toast({
        title: "Code Sent!",
        description: "Check your email for the verification code.",
      });
      
      setStep('otp');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Verify OTP
      const { data: otpData, error: otpError } = await supabase
        .from('otp_verification')
        .select('*')
        .eq('email', email)
        .eq('code', otp)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError || !otpData) {
        throw new Error('Invalid or expired verification code');
      }

      // Mark OTP as verified
      await supabase
        .from('otp_verification')
        .update({ verified: true })
        .eq('id', otpData.id);

      if (authType === 'signup') {
        setStep('password');
      } else {
        // For sign in, check if user exists
        const { data: { user }, error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (signInError) throw signInError;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in.",
        });
        navigate('/');
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, username);
      
      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Welcome to AnimeStream.",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
    } else if (step === 'password') {
      setStep('otp');
      setPassword('');
      setUsername('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4 animate-fade-in">
      <Card className="w-full max-w-md p-8 border-border/50 bg-card/80 backdrop-blur-lg shadow-2xl animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary mb-4 shadow-lg animate-glow">
            <span className="text-4xl font-bold text-white">🎬</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient">AnimeStream</h1>
          <p className="text-muted-foreground mt-2 text-center">
            {step === 'email' && 'Join the ultimate anime community'}
            {step === 'otp' && 'Verify your email'}
            {step === 'password' && 'Complete your profile'}
          </p>
        </div>

        {step === 'email' && (
          <Tabs 
            value={authType} 
            onValueChange={(v) => setAuthType(v as 'signup' | 'signin')} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="animate-slide-in-right">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="animate-slide-in-right">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value={authType} className="space-y-6 animate-fade-in">
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold hover-lift" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Continue
                      <Mail className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                We'll send you a 6-digit verification code
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === 'otp' && (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base">Enter Verification Code</Label>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <div className="flex justify-center py-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={1} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={2} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={3} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={4} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={5} className="h-14 w-14 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold hover-lift" 
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify Code
                    <Check className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSendOTP}
              >
                Resend Code
              </Button>
            </form>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <form onSubmit={handleCompleteSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base">Username (Optional)</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="otaku_master"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-base"
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold hover-lift" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Complete Sign Up
                    <Check className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
