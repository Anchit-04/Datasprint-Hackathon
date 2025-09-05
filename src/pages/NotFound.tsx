import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-earth">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
            <Leaf className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <p className="text-muted-foreground mb-8">This field seems to be empty. Let's get you back to your farm.</p>
        <Button variant="farm" size="lg" asChild>
          <a href="/" className="inline-flex items-center gap-2">
            <Home className="w-5 h-5" />
            Return to Farm
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
