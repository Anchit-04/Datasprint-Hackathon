import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Import leaflet-draw
import 'leaflet-draw';

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const featureGroup = useRef<L.FeatureGroup | null>(null);
  const [polygonCoordinates, setPolygonCoordinates] = useState<any[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([28.6139, 77.2090], 10);

    // Add tile layers
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.current);

    // Add satellite overlay
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      opacity: 0.6
    }).addTo(map.current);

    // Create feature group for drawings
    featureGroup.current = new L.FeatureGroup();
    map.current.addLayer(featureGroup.current);

    // Create draw control
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: featureGroup.current,
      },
      draw: {
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: '#22c55e',
            weight: 3,
            fillOpacity: 0.2
          }
        }
      }
    });

    map.current.addControl(drawControl);

    // Event handlers
    const onDrawCreated = (e: any) => {
      const { layer } = e;
      featureGroup.current?.addLayer(layer);
      updatePolygonCoordinates();
      toast({
        title: "Polygon Created",
        description: "Field boundary has been drawn successfully.",
      });
    };

    const onDrawEdited = () => {
      updatePolygonCoordinates();
      toast({
        title: "Polygon Updated",
        description: "Field boundary has been modified.",
      });
    };

    const onDrawDeleted = () => {
      updatePolygonCoordinates();
      toast({
        title: "Polygon Deleted",
        description: "Field boundary has been removed.",
      });
    };

    const updatePolygonCoordinates = () => {
      if (!featureGroup.current) return;

      const layers = featureGroup.current.getLayers();
      const coordinates = layers.map((layer: any) => {
        if (layer instanceof L.Polygon) {
          return {
            type: 'Polygon',
            coordinates: layer.getLatLngs().map((ring: any) => 
              ring.map((point: any) => [point.lng, point.lat])
            )
          };
        }
        return null;
      }).filter(Boolean);

      setPolygonCoordinates(coordinates);
    };

    // Add event listeners
    map.current.on(L.Draw.Event.CREATED, onDrawCreated);
    map.current.on(L.Draw.Event.EDITED, onDrawEdited);
    map.current.on(L.Draw.Event.DELETED, onDrawDeleted);

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const copyCoordinates = () => {
    if (polygonCoordinates.length > 0) {
      navigator.clipboard.writeText(JSON.stringify(polygonCoordinates, null, 2));
      toast({
        title: "Coordinates Copied",
        description: "Polygon coordinates have been copied to clipboard.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-agricultural-dark mb-4">Field Selection Map</h3>
            <div 
              ref={mapContainer} 
              className="w-full h-96 rounded-lg border border-border"
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-agricultural-dark mb-4">Instructions</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>1. Click the polygon tool in the map toolbar</p>
              <p>2. Click on the map to start drawing your field</p>
              <p>3. Click to add each corner of your field</p>
              <p>4. Click the first point again to complete</p>
              <p>5. Use edit/delete tools to modify polygons</p>
              <p>6. Coordinates are automatically captured</p>
            </div>
          </Card>

          {polygonCoordinates.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-agricultural-dark mb-4">
                Selected Fields ({polygonCoordinates.length})
              </h3>
              <div className="space-y-4">
                <div className="max-h-40 overflow-y-auto">
                  <pre className="text-xs bg-muted p-3 rounded">
                    {JSON.stringify(polygonCoordinates, null, 2)}
                  </pre>
                </div>
                <Button onClick={copyCoordinates} variant="outline" className="w-full">
                  Copy Coordinates
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;