# Root cause analysis: 404 on service pages

## Observations
- Service detail pages (`/[citySlug]/services/[serviceSlug]`) relied on `getServiceDetailsBySlug` to request data from the API using only the slug captured from the URL.
- The backend resolver `CatalogService.getServiceBySlugOrId` accepts either a slug **or** a persistent service ID and returns `null` when neither matches. 【F:apps/api/src/catalog/catalog.service.ts†L77-L105】
- Category pages generated navigation links that only preserved the slug segment. If the slug stored in the catalog diverged from the link (for example, legacy rows whose slug was updated or regenerated), the frontend kept requesting details by the outdated slug and always received `null`, which translated into a 404.

## Fix
- Carry the immutable service ID alongside the slug in category links so that a stable identifier is always available during navigation. 【F:apps/web/src/app/[citySlug]/[categorySlug]/page.tsx†L66-L89】
- Extend `getServiceDetailsBySlug` to retry with the provided ID when the slug lookup fails, allowing the detail page to succeed whenever either identifier is valid. 【F:apps/web/src/app/lib/catalog-api.ts†L78-L98】
- Update the service page (including metadata generation) to pass the optional ID to the API helper so that the fallback is exercised automatically. 【F:apps/web/src/app/[citySlug]/services/[serviceSlug]/page.tsx†L18-L70】

With these changes the detail page first attempts to keep SEO-friendly slugs, but gracefully falls back to the canonical ID whenever the slug cannot be resolved, eliminating the systematic 404s observed during navigation.
