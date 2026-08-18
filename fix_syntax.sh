sed -i '129c\
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}\
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"\
                    placeholder="username@domain.com"\
                  />\
                </div>\
              </div>' src/components/CustomerDashboard.tsx
