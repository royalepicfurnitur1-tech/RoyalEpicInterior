sed -i '57,75c\
        {/* Left Side: Brand Logo & Auth */}\
        <div className="flex items-center gap-4 sm:gap-6">\
          <div \
            onClick={() => handleNavClick('"'"'home'"'"')}\
            className="flex items-center gap-3 cursor-pointer group"\
          >\
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-md group-hover:bg-black transition-all">\
              <Crown className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />\
            </div>\
            <div>\
              <h1 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-neutral-900 group-hover:text-black transition-colors">\
                ROYAL EPIC\
              </h1>\
              <p className="text-[9px] uppercase tracking-widest text-neutral-600 font-sans font-bold">\
                Interior & Furniture\
              </p>\
            </div>\
          </div>\
          {!user && (\
            <div className="hidden sm:flex items-center gap-2 border-l border-neutral-200 pl-4 sm:pl-6">\
              <button \
                onClick={() => handleNavClick('"'"'dashboard'"'"')} \
                className="text-xs font-bold text-neutral-600 hover:text-black px-2 transition-colors"\
              >\
                Sign In\
              </button>\
              <button \
                onClick={() => handleNavClick('"'"'dashboard'"'"')} \
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors shadow-sm"\
              >\
                Sign Up\
              </button>\
            </div>\
          )}\
        </div>' src/components/Header.tsx
