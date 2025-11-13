import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Eye, 
  EyeOff,
  Sparkles,
  Shield,
  Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function Auth() {
  const { signIn, signUp, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authType, setAuthType] = useState<'signup' | 'signin'>('signin');
  const [activeTab, setActiveTab] = useState('signin');
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

  const validatePassword = (password: string): { valid: boolean; issues: string[] } => {
    const issues: string[] = [];
    if (password.length < 6) issues.push('At least 6 characters');
    if (!/(?=.*[a-z])/.test(password)) issues.push('One lowercase letter');
    if (!/(?=.*[A-Z])/.test(password)) issues.push('One uppercase letter');
    if (!/(?=.*\d)/.test(password)) issues.push('One number');
    
    return {
      valid: issues.length === 0,
      issues
    };
  };

  const handleSignIn = async (e: React.FormEvent) => {
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
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account.",
      });
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast({
        title: "Password Requirements",
        description: passwordValidation.issues.join(', '),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, username);
    
    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to AnimeFlow!",
        description: "Your account has been created successfully.",
      });
    }
    
    setLoading(false);
  };

  const passwordStrength = validatePassword(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden animate-fade-in">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-md mx-4 p-8 border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl animate-scale-in relative overflow-hidden">
        {/* Card Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5"></div>
        
        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl animate-glow">
                <span className="text-4xl font-bold text-white">🎬</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              AnimeFlow
            </h1>
            <p className="text-slate-400 text-center text-lg">
              Your gateway to endless anime adventures
            </p>
          </div>

          {/* Enhanced Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-800/50 rounded-2xl border border-white/10">
              <TabsTrigger 
                value="signin" 
                className="rounded-xl py-3 text-base font-semibold data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-xl py-3 text-base font-semibold data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In Form */}
            <TabsContent value="signin" className="space-y-6 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="signin-email" className="text-base font-semibold text-slate-200">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-14 text-base bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signin-password" className="text-base font-semibold text-slate-200">
                      Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-12 h-14 text-base bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors rounded-xl"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Sign In to AnimeFlow
                    </>
                  )}
                </Button>
              </form>

              {/* Quick Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                  <p className="text-xs text-slate-400">HD Quality</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="text-xs text-slate-400">Secure</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Smartphone className="h-5 w-5 text-blue-400" />
                  </div>
                  <p className="text-xs text-slate-400">Multi-Device</p>
                </div>
              </div>
            </TabsContent>

            {/* Sign Up Form */}
            <TabsContent value="signup" className="space-y-6 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="signup-username" className="text-base font-semibold text-slate-200">
                      Username
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="anime_lover"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="pl-12 h-14 text-base bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signup-email" className="text-base font-semibold text-slate-200">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-14 text-base bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="signup-password" className="text-base font-semibold text-slate-200">
                      Password
                    </Label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-12 h-14 text-base bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors rounded-xl"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Password strength:</span>
                          <span className={passwordStrength.valid ? "text-green-400 font-semibold" : "text-yellow-400 font-semibold"}>
                            {passwordStrength.valid ? "Strong" : "Weak"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              passwordStrength.valid 
                                ? "bg-green-500 w-full" 
                                : password.length > 0 
                                ? "bg-yellow-500 w-1/2" 
                                : "bg-slate-600 w-0"
                            }`}
                          />
                        </div>
                        {passwordStrength.issues.length > 0 && (
                          <div className="text-xs text-slate-400 space-y-1">
                            {passwordStrength.issues.map((issue, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-yellow-400 rounded-full"></div>
                                {issue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Join AnimeFlow
                    </>
                  )}
                </Button>
              </form>

              {/* Benefits List */}
              <div className="space-y-3 pt-4 border-t border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-200 text-center">Start your anime journey with:</h4>
                <div className="grid gap-2 text-sm text-slate-400">
                  {[
                    "🎬 Unlimited HD streaming",
                    "💫 Personalized recommendations",
                    "📱 Watch on any device",
                    "🎯 Track your progress",
                    "❤️ Create favorites list",
                    "🎪 Join the community"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
