sed -i 's/await supabase.from('"'"'profiles'"'"').insert(\[/try { await supabase.from('"'"'profiles'"'"').insert(\[/g' src/context/AuthContext.tsx
sed -i 's/\]).catch(() => {});/\]); } catch(e) {}/g' src/context/AuthContext.tsx
