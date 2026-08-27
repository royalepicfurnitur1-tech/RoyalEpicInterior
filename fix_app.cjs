const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The injected block
const injectedBlock1 = `          />
        ) : currentPath === '/turnkey-interior-contractors-bangalore' ? (
          <TurnkeyInteriorsPage
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)}
`;

const injectedBlock2 = `          />
        ) : currentPath === '/turnkey-interior-contractors-bangalore' ? (
          <TurnkeyInteriorsPage
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)} />
`;

const injectedBlock3 = `          />
        ) : currentPath === '/turnkey-interior-contractors-bangalore' ? (
          <TurnkeyInteriorsPage
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)} }
`;

const injectedBlock4 = `      />
        ) : currentPath === '/turnkey-interior-contractors-bangalore' ? (
          <TurnkeyInteriorsPage
            onNavigate={navigateTo}
            onRequestQuote={(title) => handleOpenQuote(title)}
`;

// Replace all with just `onRequestQuote...` which was replaced originally
content = content.replace(/onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\}\n          \/>\n        \) \: currentPath === '\/turnkey-interior-contractors-bangalore' \? \(\n          <TurnkeyInteriorsPage\n            onNavigate=\{navigateTo\}\n            onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\}\n/g, 'onRequestQuote={(title) => handleOpenQuote(title)}\n');

// Also for `...} />`
content = content.replace(/onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\}\n          \/>\n        \) \: currentPath === '\/turnkey-interior-contractors-bangalore' \? \(\n          <TurnkeyInteriorsPage\n            onNavigate=\{navigateTo\}\n            onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\} \/>\n/g, 'onRequestQuote={(title) => handleOpenQuote(title)} />\n');

// Also for `...} }`
content = content.replace(/onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\}\n          \/>\n        \) \: currentPath === '\/turnkey-interior-contractors-bangalore' \? \(\n          <TurnkeyInteriorsPage\n            onNavigate=\{navigateTo\}\n            onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\} \}\n/g, 'onRequestQuote={(title) => handleOpenQuote(title)} }\n');

// And one with just `/>`
content = content.replace(/onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\}\n      \/>\n        \) \: currentPath === '\/turnkey-interior-contractors-bangalore' \? \(\n          <TurnkeyInteriorsPage\n            onNavigate=\{navigateTo\}\n            onRequestQuote=\{\(title\) => handleOpenQuote\(title\)\}\n/g, 'onRequestQuote={(title) => handleOpenQuote(title)}\n');


fs.writeFileSync('src/App.tsx', content);
