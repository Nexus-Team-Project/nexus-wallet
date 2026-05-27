import { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { OfferPin } from '../../types/map';

/**
 * Clustering layer for the offers map. Use this when there are >50 pins
 * — far cheaper than rendering 50+ React Marker components.
 *
 * MapLibre handles clustering natively on a GeoJSON source. The cluster
 * count is rendered via a SymbolLayer (text-field reads cluster's
 * point_count). Cluster circles get larger / darker as the count grows.
 */

interface ClusterLayerProps {
  pins: OfferPin[];
  /** Pixel radius for clustering (MapLibre default is 50). */
  clusterRadius?: number;
  /** Color ramp by count thresholds. */
  colors?: { small: string; medium: string; large: string };
}

export default function ClusterLayer({
  pins,
  clusterRadius = 50,
  colors = { small: '#a5b4fc', medium: '#818cf8', large: '#6366f1' },
}: ClusterLayerProps) {
  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: pins.map((p) => ({
        type: 'Feature' as const,
        properties: {
          id: p.id,
          name: p.name,
          category: p.category,
          tenantId: p.tenantId,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [p.lng, p.lat] as [number, number],
        },
      })),
    }),
    [pins],
  );

  return (
    <Source
      id="offers"
      type="geojson"
      data={geojson}
      cluster
      clusterMaxZoom={14}
      clusterRadius={clusterRadius}
    >
      {/* Cluster bubbles */}
      <Layer
        id="cluster-circles"
        type="circle"
        filter={['has', 'point_count']}
        paint={{
          'circle-color': [
            'step',
            ['get', 'point_count'],
            colors.small, 10,
            colors.medium, 30,
            colors.large,
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16, 10,
            22, 30,
            28,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        }}
      />
      {/* Cluster count label */}
      <Layer
        id="cluster-counts"
        type="symbol"
        filter={['has', 'point_count']}
        layout={{
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13,
          'text-font': ['Noto Sans Bold', 'Open Sans Bold', 'Arial Unicode MS Bold'],
        }}
        paint={{
          'text-color': '#ffffff',
        }}
      />
      {/* Individual pins (unclustered) — small dot so the cluster->pin
          transition is smooth. The real <Marker> render still drives clicks. */}
      <Layer
        id="unclustered-points"
        type="circle"
        filter={['!', ['has', 'point_count']]}
        paint={{
          'circle-color': '#6366f1',
          'circle-radius': 4,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0,
        }}
      />
    </Source>
  );
}
