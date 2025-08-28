import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
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

const MapComponent = () => {
  const [polygonCoordinates, setPolygonCoordinates] = useState<any[]>([]);
  const featureGroupRef = useRef<L.FeatureGroup>(null);

  const onCreated = (e: any) => {
    const { layer } = e;
    const coordinates = layer.getLatLngs();
    
    updatePolygonCoordinates();
    toast({
      title: "Polygon Created",
      description: "Field boundary has been drawn successfully.",
    });
  };

  const onEdited = (e: any) => {
    updatePolygonCoordinates();
    toast({
      title: "Polygon Updated",
      description: "Field boundary has been modified.",
    });
  };

  const onDeleted = (e: any) => {
    updatePolygonCoordinates();
    toast({
      title: "Polygon Deleted",
      description: "Field boundary has been removed.",
    });
  };

  const updatePolygonCoordinates = () => {
    if (!featureGroupRef.current) return;

    const layers = featureGroupRef.current.getLayers();
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
            <div className="w-full h-96 rounded-lg border border-border overflow-hidden">
              <MapContainer
                center={[28.6139, 77.2090]} // Delhi, India coordinates
                zoom={10}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  opacity={0.6}
                />
                <FeatureGroup ref={featureGroupRef}>
                  <EditControl
                    position="topright"
                    onCreated={onCreated}
                    onEdited={onEdited}
                    onDeleted={onDeleted}
                    draw={{
                      rectangle: false,
                      circle: false,
                      circlemarker: false,
                      marker: false,
                      polyline: false,
                      polygon: {
                        allowIntersection: false,
                        drawError: {
                          color: '#e1e100',
                          message: '<strong>Error:</strong> Shape edges cannot cross!'
                        },
                        shapeOptions: {
                          color: '#22c55e',
                          weight: 3,
                          fillOpacity: 0.2
                        }
                      }
                    }}
                  />
                </FeatureGroup>
              </MapContainer>
            </div>
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