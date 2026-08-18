sed -i '81c\
                onClick={() => { window.dispatchEvent(new CustomEvent('"'"'auth-mode-change'"'"', { detail: '"'"'login'"'"' })); handleNavClick('"'"'dashboard'"'"'); }}\
' src/components/Header.tsx

sed -i '87c\
                onClick={() => { window.dispatchEvent(new CustomEvent('"'"'auth-mode-change'"'"', { detail: '"'"'register'"'"' })); handleNavClick('"'"'dashboard'"'"'); }}\
' src/components/Header.tsx
