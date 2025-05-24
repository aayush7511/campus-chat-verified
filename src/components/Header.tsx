
import { GraduationCap } from "lucide-react";

const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">StudentChat</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-6 text-gray-300">
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#safety" className="hover:text-white transition-colors">Safety</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
