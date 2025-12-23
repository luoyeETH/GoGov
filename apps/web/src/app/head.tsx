export default function Head() {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html {
              background: #f4efe8;
              color: #1c1b19;
            }
            html[data-theme="light"] {
              background: #f8fafc;
              color: #0f172a;
            }
            html[data-theme="dark"] {
              background: #09090b;
              color: #fafafa;
            }
            body {
              margin: 0;
              background: inherit;
              color: inherit;
              font-family: "Noto Serif SC", "Source Han Serif SC", "Georgia", serif;
            }
            .dropdown-menu,
            .dropdown-item {
              font-family: inherit;
            }
            .dropdown-menu a,
            .dropdown-item,
            .dropdown-item:visited {
              color: inherit;
              text-decoration: none;
            }
            .dropdown-item {
              -webkit-tap-highlight-color: transparent;
            }
            @media (max-width: 900px) {
              .desktop-nav {
                display: none !important;
              }
            }
            @media (max-width: 600px) {
              .font-size-label-text,
              .theme-label-text {
                display: none;
              }
            }
          `
        }}
      />
    </>
  );
}
