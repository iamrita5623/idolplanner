# Activity search Worker (222.html test only)

This Worker implements `GET /api/events/search?q=SHINee&country=KR&limit=20` and `GET /api/health`. Results are real Ticketmaster Discovery API records, **not comprehensive Korean/Japanese/Taiwan listings**. No fabricated results. Historical coverage depends on provider.

## Deploy
1. Create a Cloudflare Worker, paste `worker.js` and deploy.
2. In Worker Settings → Variables and Secrets, add **secret** `TICKETMASTER_API_KEY` (obtain from https://developer.ticketmaster.com/). Never put the key in GitHub or 222.html.
3. Check `https://YOUR-WORKER.workers.dev/api/health` returns `configured:true`.
4. Update `ACTIVITY_API_BASE` in `js/app-222.js` to the deployed HTTPS origin (without trailing path), bump `222.html` script version and `sw.js` cache version.
5. Verify search for SHINee/KR and SMTOWN LIVE/JP. Empty results are valid if Ticketmaster lacks listings.
6. Confirm date, venue and source before importing; geocode using existing form controls.

Security: CORS allows only the GitHub Pages origin; CORS is not authentication. Add Cloudflare rate limiting / bot protection and monitor upstream quota before broad use. The upstream API key stays secret. This Worker does not scrape ticketing websites or claim poster reuse rights.
