/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "zibby" builds Scripto for the Zibby platform; anything else is the bring-your-own-key site. */
  readonly VITE_SCRIPTO_HOST?: string;
  /** Public address of Scripto on Zibby, linked from the own-key site's "first try" card. */
  readonly VITE_ZIBBY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
