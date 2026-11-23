/** Categorical hue per cluster index. Only the hue is needed now: the backend
 *  returns cluster indices and the SVG renderer derives colour from them. */
const CLUSTER_HUES = [212, 168, 28, 350, 265, 192, 38, 300, 145, 12, 230, 88] as const

export function clusterHue(index: number): number {
  return CLUSTER_HUES[index % CLUSTER_HUES.length]
}