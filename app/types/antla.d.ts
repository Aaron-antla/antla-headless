import type {DetailedHTMLProps, HTMLAttributes} from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'antla-block': DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'sdk-key': string;
        'product-id': string;
        'variant-id'?: string;
        'cart-id'?: string;
        'cart-url'?: string;
        language?: string;
      };
    }
  }
}

export {};
