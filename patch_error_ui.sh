sed -i '96,102c\
            {error \&\& (\
              <div className={`mb-6 p-4 border rounded-xl text-sm flex items-start gap-2 ${error.includes('"'"'successful'"'"') ? '"'"'bg-green-950/50 border-green-500/50 text-green-200'"'"' : '"'"'bg-red-950/50 border-red-500/50 text-red-200'"'"'}`}>\
                <span className="mt-0.5">{error.includes('"'"'successful'"'"') ? '"'"'✅'"'"' : '"'"'⚠️'"'"'}</span>\
                <span>{error}</span>\
              </div>\
            )}' src/components/CustomerDashboard.tsx
