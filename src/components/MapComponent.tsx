import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const MapComponent = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [polygonCoordinates, setPolygonCoordinates] = useState<any[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [77.2090, 28.6139], // Delhi, India coordinates
      zoom: 10,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });

    map.current.addControl(draw.current);

    map.current.on('draw.create', updatePolygon);
    map.current.on('draw.delete', updatePolygon);
    map.current.on('draw.update', updatePolygon);

    setIsMapInitialized(true);
    toast({
      title: "Map Initialized",
      description: "You can now draw polygons on the map to select field areas.",
    });
  };

  const updatePolygon = () => {
    if (!draw.current) return;
    
    const data = draw.current.getAll();
    if (data.features.length > 0) {
      const coordinates = data.features.map(feature => ({
        type: feature.type,
        geometry: feature.geometry,
        coordinates: (feature.geometry as any).coordinates
      }));
      setPolygonCoordinates(coordinates);
      
      toast({
        title: "Polygon Updated",
        description: `${coordinates.length} polygon(s) selected. Coordinates are ready for analysis.`,
      });
    } else {
      setPolygonCoordinates([]);
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      initializeMap();
    } else {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox public token to initialize the map.",
        variant: "destructive"
      });
    }
  };

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
      {!isMapInitialized && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-agricultural-dark">Initialize Map</h3>
              <p className="text-sm text-muted-foreground">
                Enter your Mapbox public token to start using the field mapping feature.
                Get your token from{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-agricultural-primary hover:underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div>
                <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
                <Input
                  id="mapbox-token"
                  type="password"
                  placeholder="pk.eyJ1..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <Button type="submit" className="w-full">
                Initialize Map
              </Button>
            </form>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-agricultural-dark mb-4">Field Selection Map</h3>
            <div 
              ref={mapContainer} 
              className="w-full h-96 rounded-lg border border-border"
              style={{ display: isMapInitialized ? 'block' : 'none' }}
            />
            {!isMapInitialized && (
              <div className="w-full h-96 rounded-lg border border-border bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">Map will appear here after initialization</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-agricultural-dark mb-4">Instructions</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>1. Click on the map to start drawing a polygon</p>
              <p>2. Click to add each corner of your field</p>
              <p>3. Double-click to complete the polygon</p>
              <p>4. Use the trash icon to delete polygons</p>
              <p>5. Coordinates will be automatically captured</p>
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