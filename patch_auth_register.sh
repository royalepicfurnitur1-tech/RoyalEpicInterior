sed -i '/if (data.user) {/i\
    if (data.user \&\& !data.session) {\
      setError("Registration successful! Please check your email to verify your account.");\
      throw new Error("Email verification required.");\
    }' src/context/AuthContext.tsx
