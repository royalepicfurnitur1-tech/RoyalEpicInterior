sed -i '129a\
              <div className="mb-4">\
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Password</label>\
                <input\
                  type="password"\
                  required\
                  value={password}\
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}\
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"\
                  placeholder="Enter your password"\
                />\
              </div>\
              {authMode === '"'"'register'"'"' \&\& (\
                <div className="mb-4">\
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Confirm Password</label>\
                  <input\
                    type="password"\
                    required\
                    value={confirmPassword}\
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}\
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors"\
                    placeholder="Confirm your password"\
                  />\
                </div>\
              )}' src/components/CustomerDashboard.tsx
