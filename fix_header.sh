sed -i '75,91c\
          {!user \&\& (\
            <div className="hidden sm:flex items-center gap-2 border-l border-neutral-200 pl-4 sm:pl-6">\
              <button \
                onClick={() => { window.dispatchEvent(new CustomEvent('"'"'auth-mode-change'"'"', { detail: '"'"'login'"'"' })); handleNavClick('"'"'dashboard'"'"'); }}\
                className="text-xs font-bold text-neutral-600 hover:text-black px-2 transition-colors"\
              >\
                Sign In\
              </button>\
              <button \
                onClick={() => { window.dispatchEvent(new CustomEvent('"'"'auth-mode-change'"'"', { detail: '"'"'register'"'"' })); handleNavClick('"'"'dashboard'"'"'); }}\
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-sm"\
              >\
                Sign Up\
              </button>\
            </div>\
          )}' src/components/Header.tsx
