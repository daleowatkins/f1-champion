/**
 * GitHub Pages needs a 404.html so /repo/play URLs work after refresh.
 * See: https://github.com/rafgraph/spa-github-pages
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

const isProjectPage = process.env.GITHUB_PAGES === 'true'
const segmentCount = isProjectPage ? 1 : 0

const redirect404 = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>F1 Champion</title>
    <script type="text/javascript">
      var segmentCount = ${segmentCount};
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + segmentCount).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(segmentCount).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body></body>
</html>
`

fs.writeFileSync(path.join(distDir, '404.html'), redirect404, 'utf8')
console.log('Wrote dist/404.html for GitHub Pages SPA routing')
