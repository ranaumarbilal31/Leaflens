# Search and crawler setup

The build prerenders the home and explanation pages as HTML, then React hydrates them for interaction. Titles, descriptions, social-sharing metadata, and factual WebApplication/WebPage structured data are present in the initial response. There are no invented ratings, accuracy claims, or hidden keyword blocks.

- `/robots.txt` allows public content and assets for all crawlers, including search and agent crawlers. Inference endpoints are excluded from routine crawling. Robots rules are advisory, not access control.
- `/sitemap.xml` lists both public application pages.
- `/llms.txt` provides a concise reading guide and model limitations. It is supplemental documentation, not a standard all agents are guaranteed to use.
- `/social-preview.png` is a screenshot of the actual interface.

## Hosting constraint

Hugging Face injects a canonical `Link` response header pointing to `https://huggingface.co/spaces/ranaumarbilal31/leaflens` on the direct `.hf.space` domain. The home page's HTML canonical matches that platform signal. The explanation page does not add a competing canonical. Search engines may therefore show the Space page rather than the direct app URL. The Space description and repository documentation provide additional public context and links.

## Indexing status

On October 2, 2026, the live URL-prefix property was verified in Google Search Console using the public HTML verification tag. Google accepted indexing requests for both the homepage and explanation page into its priority crawl queue. The sitemap was submitted, but Google's initial fetch reported "Sitemap could not be read" despite the public endpoint returning HTTP 200 with valid XML. Submission is not proof of indexing; the property initially reported the pages as unknown to Google.

Publishing crawlable pages does not confirm inclusion in any search index. No search-engine indexing or ranking is guaranteed. Google says crawling can take days to weeks, and requesting a crawl does not guarantee inclusion: [requesting recrawls](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

For owner-managed submission, sign into Google Search Console, add the exact `https://ranaumarbilal31-leaflens.hf.space/` URL-prefix property, complete ownership verification, and submit `sitemap.xml`. Inspect the reported canonical before requesting indexing. Bing Webmaster Tools offers its own ownership and submission flow. These account steps are separate from the deployed website configuration; do not claim they are complete unless verified.

No background keep-alive traffic or paid services are used. Idle wake-up delays and hosting quotas can affect crawler availability.
