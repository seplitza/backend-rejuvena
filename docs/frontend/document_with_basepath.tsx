import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  // Get basePath from environment or use default
  const basePath = process.env.NODE_ENV === 'production' ? '/rejuvena' : '';
  
  return (
    <Html lang="ru">
      <Head>
        <meta name="description" content="Rejuvena - Омоложение лица естественным путем" />
        
        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href={`${basePath}/favicon.svg`} />
        <link rel="alternate icon" href={`${basePath}/favicon.ico`} />
        <link rel="apple-touch-icon" href={`${basePath}/apple-touch-icon.svg`} />
        <meta name="theme-color" content="#B794F6" />
        
        {/* Telegram Web App API */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        
        {/* GitHub Pages SPA redirect handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var redirect = sessionStorage.getItem('redirect');
                if (redirect) {
                  sessionStorage.removeItem('redirect');
                  history.replaceState(null, '', redirect);
                }
                if (window.location.hash && window.location.hash.startsWith('#/')) {
                  var route = window.location.hash.slice(1);
                  history.replaceState(null, '', route);
                }
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
