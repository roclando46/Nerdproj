/// <reference types="vite/client" />

import type { ReactElement, Component, JSX as ReactJSX } from 'react';

// React 19 removed the global JSX namespace. Re-declare it here for backward compatibility.
declare global {
  namespace JSX {
    type Element = ReactElement;
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ElementClass extends Component {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}
