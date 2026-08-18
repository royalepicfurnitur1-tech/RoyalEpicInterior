sed -i '34a\  const [confirmPassword, setConfirmPassword] = useState('"'"''"'"');' src/components/CustomerDashboard.tsx
sed -i 's/const \[password, setPassword\] = useState('"'"''"'"');/const \[password, setPassword\] = useState('"'"''"'"');/' src/components/CustomerDashboard.tsx
