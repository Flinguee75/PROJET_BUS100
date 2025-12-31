#!/bin/bash

# Script pour appliquer les modifications Kalman + Extrapolation
# à GodViewPage.tsx

FILE="web-admin/src/pages/GodViewPage.tsx"

# Sauvegarder le fichier original
cp "$FILE" "${FILE}.backup"

echo "Application des modifications Kalman + Extrapolation..."

# 1. Modifier la signature de animateMarkerToPosition pour ajouter le paramètre bus
# (déjà fait manuellement)

# 2. Remplacer le corps de la fonction animateMarkerToPosition
# Trouver les lignes et les remplacer
python3 << 'EOF'
import re

# Lire le fichier
with open('web-admin/src/pages/GodViewPage.tsx', 'r') as f:
    content = f.read()

# Pattern pour trouver la fonction animateMarkerToPosition
pattern = r'(const animateMarkerToPosition = useCallback\(\s*\(\s*busId: string,\s*marker: mapboxgl\.Marker,\s*targetLat: number,\s*targetLng: number,\s*targetTimestamp: number \| null,\s*bus: ClassifiedBus\s*\) => \{)(.*?)(\},\s*\[.*?\]\s*\);)'

# Nouveau corps de fonction
new_body = '''
      if (isMapInteracting.current || map.current?.isMoving() || map.current?.isZooming()) {
        marker.setLngLat([targetLng, targetLat]);
        markerMotionRef.current.set(busId, {
          lat: targetLat,
          lng: targetLng,
          timestamp: targetTimestamp,
        });
        return;
      }

      const existingRaf = markerAnimations.current.get(busId);
      if (existingRaf) {
        cancelAnimationFrame(existingRaf);
        markerAnimations.current.delete(busId);
      }

      const startLngLat = marker.getLngLat();
      const fromLat = startLngLat.lat;
      const fromLng = startLngLat.lng;
      const previousMotion = markerMotionRef.current.get(busId);
      const previousTimestamp = previousMotion?.timestamp ?? null;

      if (!kalmanFilters.current.has(busId)) {
        kalmanFilters.current.set(
          busId,
          new GpsKalmanFilter(targetLat, targetLng, 0.01, 20)
        );
      }

      const kalmanFilter = kalmanFilters.current.get(busId)!;

      let dt = 1;
      if (previousTimestamp && targetTimestamp && targetTimestamp > previousTimestamp) {
        dt = (targetTimestamp - previousTimestamp) / 1000;
      }

      const filtered = kalmanFilter.filter(targetLat, targetLng, dt);

      const FIRESTORE_AVG_LATENCY = 8000;
      let durationMs = FIRESTORE_AVG_LATENCY;
      let finalTarget = { lat: filtered.lat, lng: filtered.lng };

      if (
        bus.currentPosition &&
        typeof bus.currentPosition.speed === 'number' &&
        typeof bus.currentPosition.heading === 'number' &&
        dt > 3 &&
        bus.currentPosition.speed * 3.6 > 5
      ) {
        const extrapolationSeconds = Math.min(dt, 10);
        const extrapolated = extrapolatePosition(
          {
            lat: filtered.lat,
            lng: filtered.lng,
            speed: bus.currentPosition.speed,
            heading: bus.currentPosition.heading,
          },
          extrapolationSeconds
        );

        finalTarget = extrapolated;
        durationMs = Math.min(Math.max(dt * 1000 * 1.2, 5000), 15000);
      } else {
        durationMs = Math.min(Math.max(dt * 1000, 600), 10000);
      }

      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const rawProgress = Math.min(elapsed / durationMs, 1);

        const progress = rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

        const lat = fromLat + (finalTarget.lat - fromLat) * progress;
        const lng = fromLng + (finalTarget.lng - fromLng) * progress;
        marker.setLngLat([lng, lat]);

        if (progress < 1) {
          const rafId = requestAnimationFrame(step);
          markerAnimations.current.set(busId, rafId);
        } else {
          markerAnimations.current.delete(busId);
        }
      };

      const rafId = requestAnimationFrame(step);
      markerAnimations.current.set(busId, rafId);

      markerMotionRef.current.set(busId, {
        lat: finalTarget.lat,
        lng: finalTarget.lng,
        timestamp: targetTimestamp,
      });
    '''

# Remplacer
new_content = re.sub(
    pattern,
    r'\1' + new_body + r'\3',
    content,
    flags=re.DOTALL
)

# Sauvegarder
with open('web-admin/src/pages/GodViewPage.tsx', 'w') as f:
    f.write(new_content)

print("✓ Corps de fonction remplacé")
EOF

echo "✓ Modifications appliquées avec succès!"
echo "Fichier original sauvegardé dans ${FILE}.backup"
