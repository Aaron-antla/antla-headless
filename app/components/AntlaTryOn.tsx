import {Suspense} from 'react';
import {Await, useRouteLoaderData} from '@remix-run/react';

import type {RootLoader} from '~/root';
import {usePrefixPathWithLocale} from '~/lib/utils';

/** Keeps the web component in sync with the selected product and Hydrogen cart. */
export function AntlaTryOn({
  productId,
  variantId,
}: {
  productId: string;
  variantId?: string;
}) {
  const root = useRouteLoaderData<RootLoader>('root');
  const cartUrl = usePrefixPathWithLocale('/cart');

  // The storefront can run before Antla is configured.
  if (!root?.antla.sdkKey) return null;

  return (
    <Suspense fallback={null}>
      <Await resolve={root.cart} errorElement={null}>
        {(cart) => (
          <antla-block
            sdk-key={root.antla.sdkKey}
            product-id={productId}
            variant-id={variantId}
            cart-id={cart?.id}
            cart-url={cartUrl}
            language={root.selectedLocale.language}
          />
        )}
      </Await>
    </Suspense>
  );
}
