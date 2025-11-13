import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);
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

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
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
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-violet-500/20 to-purple-600/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-rose-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-md p-8 border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative z-10 animate-slide-up">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-2xl blur-xl -z-10"></div>
        
        <div className="flex flex-col items-center mb-8">
          {/* Animated Logo */}
          <div 
            className="relative h-20 w-20 mb-4 cursor-pointer transition-transform duration-300 hover:scale-110"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className={`absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-cyan-600 rounded-2xl shadow-2xl transition-all duration-500 ${isHovered ? 'rotate-180 scale-110' : ''}`}></div>
            <div className="absolute inset-2 bg-slate-900/90 rounded-xl backdrop-blur-sm flex items-center justify-center">
              <Sparkles className={`h-8 w-8 text-cyan-400 transition-all duration-500 ${isHovered ? 'animate-pulse scale-125' : ''}`} />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            AnimeStream
          </h1>
          <p className="text-slate-400 text-center text-sm font-light tracking-wide">
            Your gateway to infinite anime adventures
          </p>
        </div>

        <Tabs 
          value={authType} 
          onValueChange={(v) => setAuthType(v as 'signup' | 'signin')} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-slate-800/50 rounded-xl border border-white/5">
            <TabsTrigger 
              value="signin" 
              className="relative rounded-lg py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="relative rounded-lg py-2.5 text-sm font-medium transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-6 animate-fade-in">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="signin-email" className="text-sm font-medium text-slate-300">Email Address</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-violet-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-violet-500 transition-all duration-300 rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="signin-password" className="text-sm font-medium text-slate-300">Password</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-violet-400" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-violet-500 transition-all duration-300 rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 border-0"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-6 animate-fade-in">
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="signup-username" className="text-sm font-medium text-slate-300">Username (Optional)</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-cyan-400" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="otaku_master"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-cyan-500 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="signup-email" className="text-sm font-medium text-slate-300">Email Address</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-cyan-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-cyan-500 transition-all duration-300 rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="signup-password" className="text-sm font-medium text-slate-300">Password</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-cyan-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-cyan-500 transition-all duration-300 rounded-xl"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-light">
                  Must be at least 6 characters
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 border-0"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
