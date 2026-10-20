/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "zibby" builds Scripto for the Zibby platform; anything else is the free site. */
  readonly VITE_SCRIPTO_HOST?: string;
  /** The free site's scene writer (proxy/), e.g. https://scripto-api.vercel.app. */
  readonly VITE_SCRIPTO_API?: string;
  /** Public address of Scripto on Zibby, linked from the free site's "first try" card. */
  readonly VITE_ZIBBY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
