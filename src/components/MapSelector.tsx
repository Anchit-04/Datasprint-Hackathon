import { useState, useEffect } from 'react';
import { MapPin, X, Check, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapContainer, TileLayer, Polygon, useMap, useMapEvents } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import area from '@turf/area';
import { polygon as turfPolygon, AllGeoJSON } from '@turf/helpers';


// Helper component to handle map click events for drawing
const MapClickHandler = ({ isMarking, onPointAdd }: { isMarking: boolean, onPointAdd: (point: LatLngExpression) => void }) => {
  useMapEvents({
    click(e) {
      if (isMarking) {
        onPointAdd([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
};

// Helper component to change the map's view programmatically without causing re-renders
const ChangeMapView = ({ center, zoom }: { center: LatLngExpression, zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Define the props for the component, including the callback function
interface MapSelectorProps {
  isOpen: boolean
  onClose: () => void
  onLocationSelect: (location: string, coordinates?: [number, number][], areaInSqMeters?: number) => void
  currentLocation?: string
}

export const MapSelector = ({ isOpen, onClose, onLocationSelect, currentLocation }: MapSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState(currentLocation || '')
  const [isMarking, setIsMarking] = useState(false)
  const [polygonPoints, setPolygonPoints] = useState<LatLngExpression[]>([])
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([20.5937, 78.9629]) // Default to India
  const [mapZoom, setMapZoom] = useState(5)
  const [isLocationSet, setIsLocationSet] = useState(false);

  if (!isOpen) return null

  // Function to add a point when marking, limited to 4 points
  const handleAddPoint = (point: LatLngExpression) => {
    if (polygonPoints.length >= 4) {
      alert("You can only mark a maximum of 4 points.");
      setIsMarking(false); // Automatically turn off marking mode
      return;
    }

    const newPoints = [...polygonPoints, point];
    setPolygonPoints(newPoints);

    // Update the search bar with the new coordinates string
    const coordinatesString = newPoints
      .map(p => `[${(p as number[])[0].toFixed(4)}, ${(p as number[])[1].toFixed(4)}]`)
      .join(', ');
    setSearchQuery(coordinatesString);

    // If the 4th point was just added, automatically stop marking
    if (newPoints.length === 4) {
      setIsMarking(false);
    }
  };

  // Function to confirm the location, calculate area, and pass data back to the parent
  const handleLocationConfirm = () => {
    let calculatedArea = 0;
    const finalPoints = polygonPoints as [number, number][];

    // A valid polygon needs at least 3 points, and Turf needs a closed loop
    if (finalPoints.length >= 3) {
      const closedPolygonPoints = [...finalPoints, finalPoints[0]]; // Close the loop
      const turfPoly = turfPolygon([closedPolygonPoints]);
      calculatedArea = area(turfPoly as AllGeoJSON); // Calculate area in square meters
    }
    
    // Call the parent component's function with all the data
    onLocationSelect(searchQuery, finalPoints, calculatedArea);
    onClose();
  }

  // Function to get and set the user's current GPS location
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const newCenter: LatLngExpression = [latitude, longitude];
          setSearchQuery(`My GPS Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
          setMapCenter(newCenter)
          setMapZoom(16)
          setIsLocationSet(true);
        },
        (error) => {
          console.error('Error getting location:', error)
          setSearchQuery('Location access denied')
        }
      )
    }
  }

  // Function to search for an address using OpenStreetMap's geocoding service
  const handleGeocodeSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newCenter: LatLngExpression = [parseFloat(lat), parseFloat(lon)];
        setMapCenter(newCenter);
        setMapZoom(16);
        setIsLocationSet(true);
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Failed to search for the location.");
    }
  };

  // Function to clear the marked area and search query
  const handleClearArea = () => {
    setPolygonPoints([]);
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Select Farm Location
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4 overflow-auto">
          {/* Map Area */}
          <div className="aspect-video rounded-lg border border-border relative overflow-hidden">
            <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
              <ChangeMapView center={mapCenter} zoom={mapZoom} />
              
              {/* === THIS IS THE ONLY PART THAT CHANGED === */}
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />

              <MapClickHandler isMarking={isMarking} onPointAdd={handleAddPoint} />
              {polygonPoints.length > 0 && <Polygon pathOptions={{ color: 'hsl(var(--primary))' }} positions={polygonPoints} />}
            </MapContainer>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter address to search or mark field to see coordinates"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleGeocodeSearch} aria-label="Search location">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={handleUseCurrentLocation} className="sm:col-span-1">
                <MapPin className="w-4 h-4 mr-2" />
                Use My Location
              </Button>
              <Button
                onClick={() => setIsMarking(!isMarking)}
                disabled={!isLocationSet || polygonPoints.length >= 4}
                className="sm:col-span-1"
              >
                {isMarking ? "Stop Marking" : "Mark Field Area"}
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleClearArea}
                disabled={polygonPoints.length === 0}
                className="sm:col-span-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Area
              </Button>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="farm"
                onClick={handleLocationConfirm}
                disabled={polygonPoints.length < 3}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm Field Area
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

