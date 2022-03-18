export declare const DIST_DIR = 'packages/browser-destinations/dist/web/'
export declare function webBundles(): {
  [destination: string]: string
}
export declare function build(env: string): string
