sed -i '/data: { name, phone }/a\
        , emailRedirectTo: window.location.origin\
' src/context/AuthContext.tsx
