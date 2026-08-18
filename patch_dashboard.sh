sed -i '31c\
  const [authMode, setAuthMode] = useState<'"'"'login'"'"' | '"'"'register'"'"'>(() => {\
    const params = new URLSearchParams(window.location.search);\
    return params.get('"'"'mode'"'"') === '"'"'register'"'"' ? '"'"'register'"'"' : '"'"'login'"'"';\
  });\
\
  useEffect(() => {\
    const handleAuthChange = (e: any) => {\
      if (e.detail === '"'"'register'"'"') setAuthMode('"'"'register'"'"');\
      if (e.detail === '"'"'login'"'"') setAuthMode('"'"'login'"'"');\
    };\
    window.addEventListener('"'"'auth-mode-change'"'"', handleAuthChange);\
    return () => window.removeEventListener('"'"'auth-mode-change'"'"', handleAuthChange);\
  }, []);\
' src/components/CustomerDashboard.tsx
