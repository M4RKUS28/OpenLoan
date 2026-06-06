/**
 * Curated, license-clean imagery for the marketing surface.
 *
 * All photographs are served straight from Wikimedia Commons via the stable
 * `Special:FilePath` endpoint (server-side resized with `?width=`), or a direct
 * `upload.wikimedia.org` URL. They are free-licensed (CC / public domain) and
 * safe to hotlink. Each entry notes its Commons source file for attribution.
 */

const filePath = (file: string, width: number) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export const media = {
  /** Victoria Harbour at night — wide panorama, used as the hero backdrop. */
  hongKongNight: filePath("1_hong_kong_night_panorama_harbour_view_2011.jpg", 2400),

  /** Central / International Finance Centre — the finance imagery. */
  centralFinance: filePath(
    "Panoramic_Hong_Kong_cityscape-_International_Finance_Centre,_Central_District._Hong_Kong,_China,_East_Asia.jpg",
    1600,
  ),

  /** Kwai Tsing container terminals + Stonecutters Bridge — the trade imagery. */
  containerPort: filePath(
    "Stonecutters_Bridge_and_Kwai_Tsing_Container_Terminals_Hong_Kong_2024_dllu.jpg",
    1600,
  ),

  /** Aerial Kwai Tsing terminals — alternate trade shot. */
  containerAerial: filePath("Kwai_Tsing_Container_Terminals_aerial_view_2017.jpg", 1600),

  /**
   * NASA Blue Marble, equirectangular projection. Wraps seamlessly left↔right,
   * so it can scroll horizontally to fake a rotating globe. Direct upload URL.
   */
  earthTexture: "https://upload.wikimedia.org/wikipedia/commons/e/ea/Equirectangular-projection.jpg",
} as const;

export type MediaKey = keyof typeof media;
