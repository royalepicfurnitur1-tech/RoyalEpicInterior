cat << 'INNER_EOF' > /tmp/replace.tsx
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authMode === 'register' && password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }
    } catch (err) {
      // Error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };
INNER_EOF

# Replace handleAuth block
sed -i '/const handleAuth = async (e: React.FormEvent) => {/,/  };/c\  const handleAuth = async (e: React.FormEvent) => {\n    e.preventDefault();\n    \n    if (authMode === '"'"'register'"'"' \&\& password !== confirmPassword) {\n      alert("Passwords do not match!");\n      return;\n    }\n    \n    setIsSubmitting(true);\n    try {\n      if (authMode === '"'"'login'"'"') {\n        await loginWithEmail(email, password);\n      } else {\n        await registerWithEmail(name, email, password);\n      }\n    } catch (err) {\n      // Error is handled in context\n    } finally {\n      setIsSubmitting(false);\n    }\n  };' src/components/CustomerDashboard.tsx
