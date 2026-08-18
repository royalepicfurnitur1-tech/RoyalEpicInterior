sed -i '132,165c\
            {navItems.map((item) => (\
              <button\
                key={item.id}\
                onClick={() => handleNavClick(item.id)}\
                className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all ${ \
                  activeTab === item.id\
                    ? '"'"'bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black shadow-md'"'"'\
                    : '"'"'bg-[#f8f5ee] text-neutral-800 hover:bg-neutral-200 border border-gold/20'"'"'\
                }`}\
              >\
                <span>{item.label}</span>\
                <ChevronRight className="w-4 h-4 text-neutral-600" />\
              </button>\
            ))}\
            {!user \&\& (\
              <>\
                <button\
                  onClick={() => { window.dispatchEvent(new CustomEvent('"'"'auth-mode-change'"'"', { detail: '"'"'login'"'"' })); handleNavClick('"'"'dashboard'"'"'); }}\
                  className="flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all bg-[#f8f5ee] text-neutral-800 hover:bg-neutral-200 border border-gold/20"\
                >\
                  <span>Sign In</span>\
                  <ChevronRight className="w-4 h-4 text-neutral-600" />\
                </button>\
                <button\
                  onClick={() => { window.dispatchEvent(new CustomEvent('"'"'auth-mode-change'"'"', { detail: '"'"'register'"'"' })); handleNavClick('"'"'dashboard'"'"'); }}\
                  className="flex items-center justify-between p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-left transition-all bg-neutral-900 text-white shadow-md"\
                >\
                  <span>Sign Up</span>\
                  <ChevronRight className="w-4 h-4 text-neutral-400" />\
                </button>\
              </>\
            )}\
          </div>\
          <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2">\
            <button\
              onClick={() => {\
                onOpenQuote();\
                setMobileMenuOpen(false);\
              }}\
              className="w-full py-3 rounded-xl bg-gradient-to-r from-gold via-amber-400 to-yellow-500 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:brightness-105"\
            >\
              <FileText className="w-4 h-4 text-black" /> Custom Quotation\
            </button>\
            <a\
              href="https://wa.me/919916633338?text=Hi%20Royal%20Epic,%20I%20want%20to%20inquire%20about%20interior%20design"\
              target="_blank"\
              rel="noopener noreferrer"\
              className="w-full py-3 rounded-xl bg-[#f8f5ee] hover:bg-gold text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-gold/40 transition-all"\
            >\
              <MessageSquare className="w-4 h-4 text-emerald-600" /> WhatsApp Inquiry\
            </a>\
          </div>\
        </div>\
      )}\
    </header>\
  );\
};\
' src/components/Header.tsx
