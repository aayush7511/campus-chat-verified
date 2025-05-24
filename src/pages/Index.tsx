
import { useState } from "react";
import Header from "../components/Header";
import SignUp from "../components/SignUp";
import VideoChat from "../components/VideoChat";

const Index = () => {
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleSignUpSuccess = (email: string) => {
    setUserEmail(email);
    setIsSignedUp(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      {!isSignedUp ? (
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-12">
              <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
                StudentChat
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Connect with fellow students from universities worldwide. Video chat, make friends, and expand your network.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mb-12">
                <span className="bg-white/10 px-4 py-2 rounded-full">🎓 Students Only</span>
                <span className="bg-white/10 px-4 py-2 rounded-full">🔒 Secure & Private</span>
                <span className="bg-white/10 px-4 py-2 rounded-full">🌍 Global Community</span>
              </div>
            </div>
            
            <SignUp onSignUpSuccess={handleSignUpSuccess} />
          </div>
        </div>
      ) : (
        <VideoChat userEmail={userEmail} />
      )}
    </div>
  );
};

export default Index;
