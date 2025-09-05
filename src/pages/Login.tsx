import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Smartphone, Globe, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import heroImage from '@/assets/potato-field-hero.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [mobileNumber, setMobileNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const handleMobileLogin = () => {
    if (mobileNumber.length >= 10) {
      setIsLoading(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/60 to-primary/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                <Leaf className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">फसल सलाह</h1>
            <p className="text-xl text-primary font-semibold mb-1">Fasal Salah</p>
            <p className="text-muted-foreground">AI-powered crop management for farmers</p>
          </div>

          {/* Login Card */}
          <Card className="backdrop-blur-sm bg-card/95 shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-center text-foreground">
                {isRegistering ? 'Create New Account' : 'Welcome to Your Farm Assistant'}
              </CardTitle>
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-primary hover:text-primary/80 text-sm"
                >
                  {isRegistering ? 'Already have an account? Login' : 'New here? Register'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Login */}
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                variant="farm"
                size="lg"
                className="w-full"
              >
                <Globe className="w-5 h-5" />
                Login with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Mobile Login */}
              <div className="space-y-4">
                <div>
                  <Input
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="h-12 text-center text-lg"
                    maxLength={10}
                  />
                </div>
                <Button
                  onClick={handleMobileLogin}
                  disabled={isLoading || mobileNumber.length < 10}
                  variant="field"
                  size="lg"
                  className="w-full"
                >
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                  {isRegistering ? 'Register with Mobile' : 'Login with Mobile'}
                </Button>
              </div>

              {isLoading && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-primary">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Logging you in...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p className="mb-2">🌱 Trusted by 10,000+ farmers across India</p>
            <p>🔒 Your farm data is safe and secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;