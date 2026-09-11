# Antla SDK · Hydrogen demo store

A TypeScript storefront showing how to add Antla virtual try-on to a Shopify Hydrogen product page. Use it as a reference for your own integration.

The demo is based on Shopify's Hydrogen Demo Store template (Remix, React 18 and Tailwind). Antla runs as the `<antla-block>` web component: it loads product/settings data, uploads the shopper's photo, starts a try-on, polls the result and supports adding the selected variant to a Storefront cart.

## Requirements

- Node.js 20 or newer, as required by this template's package.json.
- A Shopify store configured for Hydrogen, with products published to the storefront.
- Antla installed on the **same store**, with Shopify Headless enabled and a product assigned to an Antla funnel.
- Your Antla SDK key, SDK script URL (or a local bundle) and Antla API base URL.

The demo does not contain an SDK bundle or a working SDK key. Obtain the script URL and key from your Antla integration configuration. For development before the script is hosted, use the local bundle option below.

## Run locally

```bash
npm ci
```

Connect the template to your Shopify storefront:

```bash
npx shopify hydrogen link
npx shopify hydrogen env pull
```

Merge the Antla variables from [.env.example](.env.example) into your local `.env`. Keep the Shopify credentials populated by the CLI; do not overwrite an existing `.env`.

```dotenv
PUBLIC_ANTLA_SDK_KEY=your-antla-sdk-key
PUBLIC_ANTLA_SDK_URL=/antla-sdk.js
PUBLIC_ANTLA_API_URL=https://your-antla-api.example.com
```

Replace the API placeholder with the actual Antla backend address. Then run:

```bash
npm run dev
```

Open the local URL printed by the CLI and visit a product assigned to an Antla funnel. The try-on button appears below the product purchase form. If the SDK key is empty, the demo intentionally hides Antla and continues to work as a storefront.

### Hosted SDK or local bundle

For a hosted SDK, set `PUBLIC_ANTLA_SDK_URL` to the complete HTTPS script URL provided for your environment.

For a local bundle, place `antla-sdk.js` in this repository's `public/` directory and leave `PUBLIC_ANTLA_SDK_URL=/antla-sdk.js`. The generated file is ignored by Git.

If you have access to the SDK source, build it from its directory:

```bash
VITE_ANTLA_API_BASE_URL=https://your-antla-api.example.com npm run build
```

Copy `dist/antla-sdk.js` into this demo's `public/antla-sdk.js`. Rebuild and copy it again after SDK changes.

**The API address is embedded in the SDK at build time.** `PUBLIC_ANTLA_API_URL` in this demo allows that address in CSP; it does not change where the SDK sends requests. Both must refer to the same backend. Do not reuse a bundle built for someone else's localhost or temporary tunnel.

## How the integration works

| File                                                                      | Purpose                                                                                                                            |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [app/root.tsx](app/root.tsx)                                              | Exposes the public SDK configuration through the root loader and loads the script once using Hydrogen's `Script waitForHydration`. |
| [app/components/AntlaTryOn.tsx](app/components/AntlaTryOn.tsx)            | Resolves the Hydrogen cart and renders the web component with current IDs and locale.                                              |
| [Product route](app/routes/%28%24locale%29.products.%24productHandle.tsx) | Passes `product.id` and the optimistically selected variant ID to `AntlaTryOn`.                                                    |
| [app/types/antla.d.ts](app/types/antla.d.ts)                              | Adds TypeScript JSX declarations for the web component attributes used here.                                                       |
| [app/entry.server.tsx](app/entry.server.tsx)                              | Allows SDK script, API, uploads and preview/result images in the document's Content Security Policy.                               |

Example usage in a Hydrogen product page:

```tsx
<AntlaTryOn productId={product.id} variantId={selectedVariant?.id} />
```

The wrapper renders:

```tsx
<antla-block
  sdk-key={root.antla.sdkKey}
  product-id={productId}
  variant-id={variantId}
  cart-id={cart?.id}
  cart-url={cartUrl}
  language={root.selectedLocale.language}
/>
```

| Attribute    | Required | Value used in this demo                                                                                              |
| ------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `sdk-key`    | Yes      | Antla integration key from `PUBLIC_ANTLA_SDK_KEY`.                                                                   |
| `product-id` | Yes      | Current Shopify product GID. The SDK also accepts a numeric ID as a string.                                          |
| `variant-id` | No       | Selected Shopify variant GID, updated when the shopper switches variants. Numeric IDs as strings are also supported. |
| `cart-id`    | No       | Existing Hydrogen cart's **full** Storefront GID, preserving its `?key=...` suffix. Omitted when there is no cart.   |
| `cart-url`   | No       | Locale-aware cart path, such as `/cart` or `/en-us/cart`. The SDK also accepts an absolute HTTP(S) URL.              |
| `language`   | No       | Current Hydrogen Storefront language code.                                                                           |

Do not import the SDK entry module into a server-rendered route: its registration uses browser APIs such as `HTMLElement` and `customElements`. The script loads after hydration to avoid both server evaluation and premature DOM changes.

Only public Antla configuration is exposed by the loader. Shopify Admin credentials and private Storefront tokens must remain on the server.

### Cart behavior and current limitation

An existing Hydrogen cart is passed to the SDK, so SDK cart mutations target that cart. For a quick cart test, first add an item using the storefront's regular **Add to cart** button, then run a try-on.

When no cart exists, the SDK can create one and updates its own `cart-id` attribute. This does **not** automatically set Hydrogen's server-managed cart cookie. Also, SDK Storefront mutations do not trigger Remix loader revalidation, so the cart badge/drawer can stay stale until refreshed.

This demo shows passing the host cart into the SDK; it does not yet implement the reverse synchronization. Before using SDK-created carts in a production Hydrogen storefront, synchronize the changed `cart-id` with your server cart session and revalidate the cart UI. A full page visit to the cart refreshes an existing Hydrogen cart, but does not attach an SDK-created cart to the session.

## Content Security Policy

The demo extends Hydrogen's defaults:

- `script-src`: the configured SDK script origin, or the current origin for a local bundle.
- `connect-src`: the configured Antla API origin and AWS S3 hosts used by presigned uploads.
- `img-src`: `'self'`, `blob:`, `data:` and HTTPS images. Blob/data URLs support local photo previews; HTTPS supports Shopify images and generated results from provider/storage CDNs.

For deployment, you can narrow HTTPS image sources and AWS hosts to the domains used by your Antla environment. Add other upload hosts to `connect-src` if your environment uses them.

## Troubleshooting

| Symptom                                 | Check                                                                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No try-on button                        | Fill `PUBLIC_ANTLA_SDK_KEY`, confirm the script loads, inspect console errors, and check that the product belongs to an Antla funnel on the same Shopify store. |
| SDK script returns 404                  | Put the bundle at `public/antla-sdk.js`, or configure a valid hosted `PUBLIC_ANTLA_SDK_URL`.                                                                    |
| API connection blocked by CSP           | Ensure `PUBLIC_ANTLA_API_URL` matches the address embedded in the SDK. Reload the document after changing CSP; restart dev after changing env.                  |
| Local photo preview blocked             | Keep `blob:` and `data:` in `imgSrc`.                                                                                                                           |
| Upload blocked                          | Inspect whether the failure is CSP, S3 CORS, or an expired upload URL. CSP permissions do not configure the bucket's CORS policy.                               |
| API returns 401                         | Check the SDK key and that the Antla Headless integration is enabled.                                                                                           |
| ngrok returns `ERR_NGROK_3200`          | Restart the backend tunnel. If its URL changes, rebuild the SDK and update the demo's API URL.                                                                  |
| Vite says the ngrok host is not allowed | Add that hostname to `server.allowedHosts` in the **Antla backend's** Vite config.                                                                              |
| Cart page differs from the SDK cart     | See the cart synchronization limitation above.                                                                                                                  |

## Verification and deployment

```bash
npm run typecheck
npm run lint
npm run build
```

Use the deployment environment's Shopify credentials and public Antla variables. A local bundle must be available in `public/` during the build; for a hosted script, use its production URL.

Manual integration checks:

1. Open an eligible product and change its selected variant.
2. Add an item using Hydrogen's regular cart button so there is an existing cart.
3. Open Antla, select a photo, complete a try-on and observe the result.
4. Add the variant through Antla and visit the cart page to verify the existing cart.
5. Check another locale if the storefront supports localization.

## Customer accounts (optional)

The account pages are inherited from the Hydrogen template. To use them, configure the Shopify Customer Account API credentials and the storefront's public callback URL (`/account/authorize`), JavaScript origin and logout URL. Customer Account API sign-in is separate from the Antla SDK integration.

Built on [Shopify Hydrogen](https://shopify.dev/docs/storefronts/headless/hydrogen).
