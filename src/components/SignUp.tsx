
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignUpProps {
  onSignUpSuccess: (email: string) => void;
}

const SignUp = ({ onSignUpSuccess }: SignUpProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isValidStudentEmail = (email: string) => {
    const eduPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu$/;
    const acPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.ac\.[a-z]{2,}$/;
    return eduPattern.test(email) || acPattern.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidStudentEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use a valid student email address (.edu or .ac domains)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate email verification process
    setTimeout(() => {
      toast({
        title: "Welcome to StudentChat!",
        description: "Your student email has been verified successfully.",
      });
      onSignUpSuccess(email);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl mb-2">Join StudentChat</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your student email to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your.name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
              <p className="text-xs text-gray-400">
                We only accept .edu and .ac domain emails
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Start Chatting"}
            </Button>
          </form>
          
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-gray-300">Secure</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-gray-300">Students Only</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Mail className="w-8 h-8 text-pink-400" />
              <span className="text-xs text-gray-300">Verified</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
