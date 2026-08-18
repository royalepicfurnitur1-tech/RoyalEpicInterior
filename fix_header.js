const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
`          {!user && (
            <div className="hidden sm:flex items-center gap-2 border-l border-neutral-200 pl-4 sm:pl-6">
              <button 
                onClick={() => handleNavClick('dashboard')} 
                className="text-xs font-bold text-neutral-600 hover:text-black px-2 transition-colors"
              >
                onClick={() => { window.dispatchEvent(new CustomEvent('auth-mode-change', { detail: 'login' })); handleNavClick('dashboard'); }}

              </button>
              <button 
                onClick={() => handleNavClick('dashboard')} 
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-sm"
                onClick={() => { window.dispatchEvent(new CustomEvent('auth-mode-change', { detail: 'register' })); handleNavClick('dashboard'); }}

                Sign Up
              </button>
            </div>
          )}`,
`          {!user && (
            <div className="hidden sm:flex items-center gap-2 border-l border-neutral-200 pl-4 sm:pl-6">
              <button 
                onClick={() => { window.dispatchEvent(new CustomEvent('auth-mode-change', { detail: 'login' })); handleNavClick('dashboard'); }}
                className="text-xs font-bold text-neutral-600 hover:text-black px-2 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => { window.dispatchEvent(new CustomEvent('auth-mode-change', { detail: 'register' })); handleNavClick('dashboard'); }}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}`);

fs.writeFileSync('src/components/Header.tsx', code);
