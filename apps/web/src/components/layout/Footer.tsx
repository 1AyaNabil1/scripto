import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
        <footer className="bg-neutral-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Link 
              to="/"
              className="text-base sm:text-lg md:text-xl font-semibold bg-clip-text text-transparent hover:opacity-80 transition-opacity duration-200 inline-block"
              style={{
                backgroundImage: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
              }}
            >
              Scripto
            </Link>
            <p className="text-neutral-400">
              Transform your stories into visual narratives with AI-powered storyboard generation.
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/try-app" 
                  className="text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  Try Scripto
                </Link>
              </li>
              <li>
                <Link 
                  to="/gallery" 
                  className="text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  View Gallery
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  onClick={() => {
                    setTimeout(() => {
                      const element = document.getElementById('team-section');
                      if (element) element.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  Meet Project Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">Connect</h4>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/1AyaNabil1" 
                className="text-neutral-400 hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/in/ayanabil11" 
                className="text-neutral-400 hover:text-white transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="mailto:contact@ayanexus.dev" 
                className="text-neutral-400 hover:text-white transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base">
            © 2025 Scripto. All rights reserved.
          </p>
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base flex items-center mt-2 md:mt-0">
            Developed by{' '}
            <a 
              href="https://ayanexus.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 mx-1"
            >
              AyaNexus 🦢
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
