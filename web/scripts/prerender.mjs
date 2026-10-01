import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { render } from '../.ssr/entry-server.js';

const origin = 'https://ranaumarbilal31-leaflens.hf.space';
const space = 'https://huggingface.co/spaces/ranaumarbilal31/leaflens';
const template = await readFile('dist/index.html', 'utf8');
const pages = [
  {path:'/', title:'LeafLens — Plant Leaf Checker & Disease Classification', description:'Check a leaf photo for a possible plant and condition match. Explore 14 plants and 38 leaf categories with LeafLens, a free plant leaf image classifier.'},
  {path:'/how-it-works', title:'How LeafLens Works — Supported Plants, Model & Limitations', description:'Learn how LeafLens checks leaf photos, which plants and conditions it supports, and the limitations of its 38-category ResNet9 image classifier.'},
];
for (const page of pages) {
  const url = origin + page.path;
  const schema = {'@context':'https://schema.org','@type': page.path === '/' ? 'WebApplication' : 'WebPage', name:page.title, description:page.description, url, inLanguage:'en', ...(page.path === '/' ? {applicationCategory:'EducationalApplication',operatingSystem:'Any',isAccessibleForFree:true, sameAs:['https://github.com/ranaumarbilal31/leaflens',space]} : {isPartOf:{'@type':'WebSite',name:'LeafLens',url:origin}})};
  const metadata = `<meta name="description" content="${page.description}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="google-site-verification" content="sFusMQ3C4_OpjwrR4Pjm4nPAzs1agylIOYO4KvE708c" />
    ${page.path === '/' ? `<link rel="canonical" href="${space}" />` : ''}
    <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="LeafLens" />
    <meta property="og:title" content="${page.title}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${origin}/social-preview.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="LeafLens plant leaf checker" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${page.title}" />
    <meta name="twitter:description" content="${page.description}" />
    <meta name="twitter:image" content="${origin}/social-preview.png" />
    <script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`;
  const html = template.replace(/<title>.*?<\/title>/, `<title>${page.title}</title>${metadata}`).replace('<div id="root"></div>', `<div id="root">${render(page.path)}</div>`);
  const file = page.path === '/' ? 'dist/index.html' : 'dist/how-it-works/index.html';
  if (page.path !== '/') await mkdir('dist/how-it-works', {recursive:true});
  await writeFile(file, html);
}
