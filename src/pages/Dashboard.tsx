import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Upload,
  Leaf,
  Droplets,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Bell,
  LogOut,
  ArrowLeft,
  FileText,
  PieChart as PieChartIcon,
  Bug,
  X,
  Thermometer,
  Wind,
  Eye,
  Activity,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MapSelector } from "@/components/MapSelector";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

//================================================================
// DATA & CONFIGURATION
//================================================================

const conversionFactors: { [key: string]: number } = {
  sq_m: 1,
  sq_ft: 10.7639,
  acres: 0.000247105,
  hectares: 0.0001,
  bigha: 0.000074752,
  katha: 0.00149505,
};

const detailedSoilData = {
  general: [
    { name: "pH Level", value: "5.8", status: "Low" },
    { name: "Organic Carbon (OC)", value: "0.45%", status: "Low" },
  ],
  macroNutrients: [
    { name: "Nitrogen (N)", value: "210 kg/ha", status: "Low" },
    { name: "Phosphorus (P)", value: "15 kg/ha", status: "Optimal" },
    { name: "Potassium (K)", value: "120 kg/ha", status: "Low" },
  ],
  microNutrients: [
    { name: "Zinc (Zn)", value: "0.5 ppm", status: "Low" },
    { name: "Iron (Fe)", value: "4.8 ppm", status: "Optimal" },
  ],
};

const macroPieData = [
  { name: "Nitrogen (N)", value: 210 },
  { name: "Phosphorus (P)", value: 15 },
  { name: "Potassium (K)", value: 120 },
];
const generalPieData = [
  { name: "pH Level", value: 5.8 },
  { name: "Organic Carbon (%)", value: 0.45 },
];
const microPieData = [
  { name: "Zinc (Zn)", value: 0.5 },
  { name: "Iron (Fe)", value: 4.8 },
];

const COLORS_MACRO = ["#FF6B35", "#00D4AA", "#FFD93D"];
const COLORS_GENERAL = ["#6366F1", "#10B981"];
const COLORS_MICRO = ["#3B82F6", "#F87171"];

//================================================================
// HELPER LOGIC
//================================================================

const computeCentroid = (
  coords: [number, number][]
): { lat: number; lon: number } | null => {
  if (!coords || coords.length === 0) return null;
  let area = 0, cx = 0, cy = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % coords.length];
    const cross = x1 * y2 - x2 * y1;
    area += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-12) {
    const [lat, lon] = coords[0];
    return { lat, lon };
  }
  cx = cx / (6 * area);
  cy = cy / (6 * area);
  return { lat: cx, lon: cy };
};

const num = (s: string | number) => {
  if (typeof s === "number") return s;
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
};

const buildPieFromSoil = (soil: typeof detailedSoilData) => {
  const macro = [
    { name: "Nitrogen (N)", value: num(soil.macroNutrients.find(n => n.name.includes('(N)'))?.value ?? 0) },
    { name: "Phosphorus (P)", value: num(soil.macroNutrients.find(n => n.name.includes('(P)'))?.value ?? 0) },
    { name: "Potassium (K)", value: num(soil.macroNutrients.find(n => n.name.includes('(K)'))?.value ?? 0) },
  ];
  const general = [
    { name: "pH Level", value: num(soil.general.find(g => g.name.includes('pH'))?.value ?? 0) },
    { name: "Organic Carbon (%)", value: num(soil.general.find(g => g.name.includes('Organic Carbon'))?.value ?? 0) },
  ];
  const micro = [
    { name: "Zinc (Zn)", value: num(soil.microNutrients.find(m => m.name.includes('(Zn)'))?.value ?? 0) },
    { name: "Iron (Fe)", value: num(soil.microNutrients.find(m => m.name.includes('(Fe)'))?.value ?? 0) },
  ];
  return { macro, general, micro };
};

type WeatherDaily = {
  dt: number;
  temp: { min: number; max: number };
  pop: number;
  rain?: number;
  wind_speed?: number;
  humidity?: number;
  weather?: { main: string; description: string; icon: string }[];
};

const analyzeWeather = (daily: WeatherDaily[]) => {
  const alerts: string[] = [];
  let heavyRainDays = 0, droughtStreak = 0, maxHeatStreak = 0;

  daily.forEach(d => {
    const rainAmount = (d.rain ?? 0);
    if (rainAmount >= 50 || (d.pop >= 0.8 && rainAmount >= 30)) heavyRainDays++;
    const isDryHot = (d.pop <= 0.2) && (d.temp.max >= 35);
    droughtStreak = isDryHot ? droughtStreak + 1 : 0;
    maxHeatStreak = Math.max(maxHeatStreak, droughtStreak);
    if ((d.wind_speed ?? 0) >= 12) alerts.push('High winds expected — risk of lodging and spray drift.');
    if ((d.humidity ?? 0) >= 90 && (d.temp.max >= 28)) alerts.push('Very humid & warm — fungal disease pressure likely.');
  });

  if (heavyRainDays >= 1) alerts.push('Heavy rain likely — leaching of Nitrogen and Potassium expected.');
  if (maxHeatStreak >= 3) alerts.push('Heat wave & dry spell for 3+ days — drought stress risk.');
  if (!alerts.length) alerts.push('No unusual weather risks detected this week.');

  const adjusted = JSON.parse(JSON.stringify(detailedSoilData));

  if (heavyRainDays >= 1) {
    const n = adjusted.macroNutrients.find((n: any) => n.name.includes('(N)'));
    const k = adjusted.macroNutrients.find((n: any) => n.name.includes('(K)'));
    const pH = adjusted.general.find((g: any) => g.name.includes('pH'));
    const oc = adjusted.general.find((g: any) => g.name.includes('Organic Carbon'));
    if (n) n.value = `${Math.max(0, num(n.value) * 0.9).toFixed(0)} kg/ha`;
    if (k) k.value = `${Math.max(0, num(k.value) * 0.92).toFixed(0)} kg/ha`;
    if (pH) pH.value = (Math.max(0, num(pH.value) - 0.1)).toFixed(1);
    if (oc) oc.value = `${Math.max(0, num(oc.value) * 0.98).toFixed(2)}%`;
  }

  if (maxHeatStreak >= 3) {
    const k = adjusted.macroNutrients.find((n: any) => n.name.includes('(K)'));
    const pH = adjusted.general.find((g: any) => g.name.includes('pH'));
    const oc = adjusted.general.find((g: any) => g.name.includes('Organic Carbon'));
    if (k) k.value = `${Math.max(0, num(k.value) * 0.95).toFixed(0)} kg/ha`;
    if (pH) pH.value = (num(pH.value) + 0.1).toFixed(1);
    if (oc) oc.value = `${(num(oc.value) * 1.03).toFixed(2)}%`;
  }

  const setStatus = () => {
    const n = num(adjusted.macroNutrients.find((x: any) => x.name.includes('(N)'))?.value ?? 0);
    const p = num(adjusted.macroNutrients.find((x: any) => x.name.includes('(P)'))?.value ?? 0);
    const k = num(adjusted.macroNutrients.find((x: any) => x.name.includes('(K)'))?.value ?? 0);
    const pH = num(adjusted.general.find((x: any) => x.name.includes('pH'))?.value ?? 0);
    const oc = num(adjusted.general.find((x: any) => x.name.includes('Organic Carbon'))?.value ?? 0);
    const set = (arr: any[], name: string, status: string) => { if (arr.find(a => a.name === name)) arr.find(a => a.name === name).status = status; };
    set(adjusted.macroNutrients, 'Nitrogen (N)', n < 250 ? 'Low' : n > 350 ? 'High' : 'Optimal');
    set(adjusted.macroNutrients, 'Phosphorus (P)', p < 12 ? 'Low' : p > 30 ? 'High' : 'Optimal');
    set(adjusted.macroNutrients, 'Potassium (K)', k < 150 ? 'Low' : k > 300 ? 'High' : 'Optimal');
    set(adjusted.general, 'pH Level', pH < 6.0 ? 'Low' : pH > 7.5 ? 'High' : 'Optimal');
    set(adjusted.general, 'Organic Carbon (OC)', oc < 0.75 ? 'Low' : oc > 1.5 ? 'High' : 'Optimal');
  };
  setStatus();

  const recs = {
    fertilizer: heavyRainDays ? 'Split-apply N & K (e.g., Urea + MOP) after heavy rain; add stabilizers (NBPT) to reduce N losses.' : maxHeatStreak >= 3 ? 'Prefer K-rich blends (e.g., 10-5-20) to aid osmotic balance; avoid surface-applied urea before irrigation.' : 'Balanced NPK (10-5-20). Base dose with top-up based on soil test and crop stage.',
    zinc: 'Apply Zinc Sulphate (21%) ~10 kg/acre at soil prep or 0.5% foliar if deficiency persists.',
    pH: (heavyRainDays ? 'Consider light liming to buffer acidity from rain; ' : '') + 'Use dolomitic lime if Mg is low.',
    irrigation: maxHeatStreak >= 3 ? 'Adopt shorter, more frequent irrigation; mulch to conserve soil moisture.' : heavyRainDays ? 'Delay irrigation for 2–3 days post heavy rain; improve drainage if waterlogging.' : 'Irrigate 2–3 days interval based on field condition.',
    pest: (daily.some(d => (d.humidity ?? 0) >= 90) ? 'High humidity: scout for late blight; preventive Mancozeb/Chlorothalonil spray window.' : 'Keep scouting for aphids/whiteflies; use yellow sticky traps; spot-treat with Imidacloprid if needed.')
  };

  return { alerts: Array.from(new Set(alerts)), adjustedSoil: adjusted, recs };
};

//================================================================
// DASHBOARD COMPONENT
//================================================================
const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailedAnalysisRef = useRef<HTMLDivElement>(null);

  // --- STATE MANAGEMENT ---
  const [location, setLocation] = useState("");
  const [fieldAreaInSqM, setFieldAreaInSqM] = useState(0);
  const [displayedArea, setDisplayedArea] = useState("0.00");
  const [unit, setUnit] = useState("acres");
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [showDetailedSoilCard, setShowDetailedSoilCard] = useState(false);
  const [fieldPolygon, setFieldPolygon] = useState<[number, number][]>([]);

  // --- WEATHER STATE ---
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [dailyForecast, setDailyForecast] = useState<WeatherDaily[]>([]);
  const [showWeatherAnalysis, setShowWeatherAnalysis] = useState(false);

  // --- ADAPTIVE SOIL/RECS STATE ---
  const [adaptiveSoil, setAdaptiveSoil] = useState<typeof detailedSoilData>(detailedSoilData);
  const [adaptiveMacroPie, setAdaptiveMacroPie] = useState(macroPieData);
  const [adaptiveGeneralPie, setAdaptiveGeneralPie] = useState(generalPieData);
  const [adaptiveMicroPie, setAdaptiveMicroPie] = useState(microPieData);
  const [weatherAlerts, setWeatherAlerts] = useState<string[]>([]);
  const [adaptiveRecs, setAdaptiveRecs] = useState({
    fertilizer: 'Balanced NPK (10-5-20). Base dose with top-up based on soil test and crop stage.',
    zinc: 'Apply Zinc Sulphate (21%) ~10 kg/acre at soil prep or 0.5% foliar if deficiency persists.',
    pH: 'Use dolomitic lime if Mg is low.',
    irrigation: 'Irrigate 2–3 days interval based on field condition.',
    pest: 'Keep scouting for aphids/whiteflies; use yellow sticky traps; spot-treat with Imidacloprid if needed.'
  });

  // --- EFFECTS ---
  useEffect(() => {
    if (fieldAreaInSqM > 0) {
      setDisplayedArea((fieldAreaInSqM * conversionFactors[unit]).toFixed(2));
    } else {
      setDisplayedArea("0.00");
    }
  }, [fieldAreaInSqM, unit]);

  useEffect(() => {
    if (showDetailedSoilCard && detailedAnalysisRef.current) {
      detailedAnalysisRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showDetailedSoilCard]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!coords || fieldAreaInSqM <= 0) return;
      setWeatherLoading(true);
      setWeatherError(null);
      const apiKey = import.meta.env.VITE_OWM_KEY as string;
      if (!apiKey) {
        setWeatherError("Missing API key: Please add VITE_OWM_KEY to your .env file.");
        setWeatherLoading(false);
        return;
      }
      try {
        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(res.status === 401 ? "Invalid API key" : `Weather API error: ${res.status}`);
        }
        const data = await res.json();
        setCurrentWeather(data.current || null);
        const next7 = (data.daily || []).slice(0, 7) as WeatherDaily[];
        setDailyForecast(next7);
        const { alerts, adjustedSoil, recs } = analyzeWeather(next7);
        setWeatherAlerts(alerts);
        setAdaptiveSoil(adjustedSoil);
        const { macro, general, micro } = buildPieFromSoil(adjustedSoil);
        setAdaptiveMacroPie(macro);
        setAdaptiveGeneralPie(general);
        setAdaptiveMicroPie(micro);
        setAdaptiveRecs(recs);
      } catch (e: any) {
        setWeatherError(e.message || "Failed to fetch weather");
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [coords, fieldAreaInSqM]);

  // --- HANDLER FUNCTIONS ---
  const handleFileUpload = () => fileInputRef.current?.click();
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setUploadedFile(file);
  };
  const handleLogout = () => navigate("/");

  const handleMapLocationSelect = (
    selectedLocation: string,
    coordinates?: [number, number][],
    areaInSqMeters?: number
  ) => {
    setLocation(selectedLocation);
    if (areaInSqMeters) setFieldAreaInSqM(areaInSqMeters);
    if (coordinates && coordinates.length) {
      setFieldPolygon(coordinates);
      const cen = computeCentroid(coordinates);
      if (cen) setCoords(cen);
    }
  };

  const handleAnalyze = () => {
    if (location && fieldAreaInSqM > 0) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setHasAnalysis(true);
      }, 3000);
    }
  };

  // --- UI HELPER FUNCTIONS ---
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "low": return <Badge variant="destructive" className="text-xs font-medium">Low</Badge>;
      case "optimal": return <Badge className="text-xs font-medium bg-emerald-500 hover:bg-emerald-600">Optimal</Badge>;
      case "high": return <Badge variant="secondary" className="text-xs font-medium">High</Badge>;
      default: return null;
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "low": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "optimal": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "high": return <TrendingUp className="w-4 h-4 text-amber-500" />;
      default: return null;
    }
  };

  const fmtDate = (unix: number) => new Date(unix * 1000).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  const iconUrl = (ic?: string) => ic ? `https://openweathermap.org/img/wn/${ic}@2x.png` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/20">
      {/* Enhanced Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-green-200/50 dark:border-green-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-green-100 dark:hover:bg-green-900/50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                  <Leaf className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Fasal Salah
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, Farmer!</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs bg-red-500 text-white">2</Badge>
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/50">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Analysis Input Card */}
        <Card className="mb-8 shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              Let's Analyze Your Farm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Farm Location</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Click map to select location & mark area" 
                    value={location} 
                    readOnly 
                    className="flex-1 border-green-200 focus:border-green-500 dark:border-green-800" 
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMapSelector(true)}
                    className="border-green-200 hover:bg-green-50 hover:border-green-300 dark:border-green-800 dark:hover:bg-green-900/50"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Map
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Calculated Field Area</label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 border border-green-200 bg-green-50/50 rounded-md text-gray-700 dark:border-green-800 dark:bg-green-900/20 dark:text-gray-300">
                    {displayedArea}
                  </div>
                  <select 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)} 
                    className="px-3 py-2 border border-green-200 bg-white rounded-md text-gray-700 focus:border-green-500 dark:border-green-800 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <option value="sq_m">Sq Meter</option>
                    <option value="sq_ft">Sq Ft</option>
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="bigha">Bigha</option>
                    <option value="katha">Katha</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Soil Health Card</label>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
                <Button 
                  variant={uploadedFile ? "default" : "outline"} 
                  className={`w-full justify-start gap-2 ${
                    uploadedFile 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                      : 'border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/50'
                  }`} 
                  onClick={handleFileUpload}
                >
                  {uploadedFile ? <FileText className="w-4 h-4" /> : <Upload className="w-4 h-4" />} 
                  {uploadedFile ? uploadedFile.name : 'Upload PDF'}
                </Button>
                {uploadedFile && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> File uploaded successfully
                  </p>
                )}
              </div>
            </div>
            <div className="pt-2">
              <Button 
                onClick={handleAnalyze} 
                disabled={!location || fieldAreaInSqM === 0 || isAnalyzing} 
                size="lg" 
                className={`w-full md:w-auto px-8 py-3 ${
                  isAnalyzing 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                } text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Analyzing Your Farm...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-3" />
                    Analyze My Farm
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {hasAnalysis && (
          <>
            <div className="grid xl:grid-cols-3 gap-8">
              {/* --- LEFT COLUMN (2/3 width) --- */}
              <div className="xl:col-span-2 space-y-8">
                {/* Enhanced Field Analysis Map */}
                <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      Field Analysis Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="aspect-square rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden relative shadow-lg">
                      {coords && fieldPolygon.length > 0 ? (
                        <MapContainer center={[coords.lat, coords.lon]} zoom={17} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; <a href="https://www.esri.com/">Esri</a>' />
                          <Polygon positions={fieldPolygon} pathOptions={{ color: "white", weight: 3 }} />
                          <Polygon positions={[[fieldPolygon[0], [(fieldPolygon[0][0] + fieldPolygon[1][0]) / 2, (fieldPolygon[0][1] + fieldPolygon[1][1]) / 2], [(fieldPolygon[3][0] + fieldPolygon[2][0]) / 2, (fieldPolygon[3][1] + fieldPolygon[2][1]) / 2], fieldPolygon[3]]]} pathOptions={{ fillColor: "#10b981", color: "transparent", fillOpacity: 0.4 }} />
                          <Polygon positions={[[fieldPolygon[1], fieldPolygon[2], [(fieldPolygon[3][0] + fieldPolygon[2][0]) / 2, (fieldPolygon[3][1] + fieldPolygon[2][1]) / 2], [(fieldPolygon[0][0] + fieldPolygon[1][0]) / 2, (fieldPolygon[0][1] + fieldPolygon[1][1]) / 2]]]} pathOptions={{ fillColor: "#f59e0b", color: "transparent", fillOpacity: 0.5 }} />
                        </MapContainer>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                          <div className="text-center">
                            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400">Select your field to view the analysis map</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-4 right-4 z-[401] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-4 h-4 bg-emerald-500/70 rounded-full border-2 border-emerald-500"></div>
                          <span className="text-xs font-medium">Healthy zones</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-amber-500/70 rounded-full border-2 border-amber-500"></div>
                          <span className="text-xs font-medium">Needs attention</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Weather Card */}
                <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg">
                        <Droplets className="w-5 h-5 text-white" />
                      </div>
                      Weather & 7-Day Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!coords || fieldAreaInSqM === 0 ? (
                      <div className="text-center py-8">
                        <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Select your field on the map to load weather data</p>
                      </div>
                    ) : weatherLoading ? (
                      <div className="flex items-center justify-center gap-3 py-8">
                        <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-gray-600 dark:text-gray-400">Fetching weather data...</span>
                      </div>
                    ) : weatherError ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-600 dark:text-red-400">Failed to load weather: {weatherError}</p>
                      </div>
                    ) : (
                      <>
                        {currentWeather && (
                          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-4">
                              {currentWeather.weather?.[0]?.icon && (
                                <img alt="weather" className="w-16 h-16" src={iconUrl(currentWeather.weather[0].icon)} />
                              )}
                              <div>
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                  {currentWeather.weather?.[0]?.main}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Thermometer className="w-4 h-4" />
                                    {Math.round(currentWeather.temp)}°C
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Droplets className="w-4 h-4" />
                                    {currentWeather.humidity}%
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Wind className="w-4 h-4" />
                                    {Math.round(currentWeather.wind_speed)} m/s
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                              <div>Lat: {coords.lat.toFixed(3)}</div>
                              <div>Lon: {coords.lon.toFixed(3)}</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                          {dailyForecast.map((d, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                              <div className="text-xs font-medium text-center text-gray-600 dark:text-gray-400 mb-2">
                                {fmtDate(d.dt)}
                              </div>
                              {d.weather?.[0]?.icon && (
                                <img alt="weather" className="w-12 h-12 mx-auto mb-2" src={iconUrl(d.weather[0].icon)} />
                              )}
                              <div className="text-sm text-center font-semibold text-gray-800 dark:text-gray-200">
                                {Math.round(d.temp.max)}° / {Math.round(d.temp.min)}°
                              </div>
                              <div className="text-xs text-center text-blue-600 dark:text-blue-400 mt-1">
                                {Math.round((d.pop ?? 0) * 100)}% rain
                              </div>
                              {d.rain && (
                                <div className="text-xs text-center text-blue-700 dark:text-blue-300 font-medium">
                                  {Math.round(d.rain)}mm
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowWeatherAnalysis(true)}
                            className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/50"
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            Weather Impact Analysis
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Enhanced AI Recommendations */}
                <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                        <Leaf className="w-5 h-5 text-white" />
                      </div>
                      AI-Powered Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Leaf className="w-4 h-4 text-white" />
                          </div>
                          Fertilizer Management Plan
                        </h4>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">Weather-adaptive:</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-1">{adaptiveRecs.fertilizer}</span>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">Zinc deficiency:</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-1">{adaptiveRecs.zinc}</span>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">pH management:</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-1">{adaptiveRecs.pH}</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                            <Bug className="w-4 h-4 text-white" />
                          </div>
                          Pest & Disease Management
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{adaptiveRecs.pest}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <span className="font-semibold">Disclaimer:</span> These are AI-generated recommendations based on available data. Always consult local agricultural experts and follow product labels for best results.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Weather Analysis Card */}
                {showWeatherAnalysis && (
                  <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        Weather Impact on Soil & Alerts
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowWeatherAnalysis(false)} 
                        className="hover:bg-purple-100 dark:hover:bg-purple-900/50"
                      >
                        <X className="w-4 h-4 mr-1" /> Hide
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Soil Health Changes (Weather-Projected)</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {adaptiveSoil.general.map((g) => (
                            <div key={g.name} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{g.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{g.value}</span>
                                {getStatusBadge(g.status)}
                              </div>
                            </div>
                          ))}
                          {adaptiveSoil.macroNutrients.map((m) => (
                            <div key={m.name} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{m.value}</span>
                                {getStatusBadge(m.status)}
                                {getStatusIcon(m.status)}
                              </div>
                            </div>
                          ))}
                          {adaptiveSoil.microNutrients.map((m) => (
                            <div key={m.name} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{m.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{m.value}</span>
                                {getStatusBadge(m.status)}
                                {getStatusIcon(m.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Weather Alerts & Warnings</h4>
                        <div className="space-y-3">
                          {weatherAlerts.map((alert, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm text-gray-700 dark:text-gray-300">{alert}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-4 text-gray-800 dark:text-gray-200">Actionable Updates</h4>
                        <div className="space-y-3">
                          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800">
                            <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Irrigation Strategy</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{adaptiveRecs.irrigation}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                            <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Fertilizer Adjustment</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{adaptiveRecs.fertilizer}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800">
                            <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">Pest Control</div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{adaptiveRecs.pest}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* --- RIGHT COLUMN (1/3 width) --- */}
              <div className="space-y-6">
                {/* Enhanced Crop Growth Stage */}
                <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <Leaf className="w-5 h-5 text-white" />
                      </div>
                      Crop Growth Stage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">Flowering Stage</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tuber development in progress</p>
                    </div>
                    <div className="relative mb-4">
                      <Progress value={60} className="h-3" />
                      <div className="absolute top-0 left-[60%] w-4 h-4 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-0.5 shadow-lg ring-4 ring-white dark:ring-gray-800"></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Planting</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">Flowering</span>
                      <span>Harvest</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Soil Health Report */}
                <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      Soil Health Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 uppercase tracking-wide">General Metrics</h4>
                        <div className="space-y-2">
                          {adaptiveSoil.general.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.value}</span>
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 uppercase tracking-wide">Macronutrients</h4>
                        <div className="space-y-2">
                          {adaptiveSoil.macroNutrients.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-800/50 dark:to-emerald-800/50">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(item.status)}
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 uppercase tracking-wide">Micronutrients</h4>
                        <div className="space-y-2">
                          {adaptiveSoil.microNutrients.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-800/50 dark:to-violet-800/50">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(item.status)}
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-6 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/50" 
                      onClick={() => setShowDetailedSoilCard(true)}
                    >
                      <PieChartIcon className="w-4 h-4 mr-2" />
                      View Detailed Analysis
                    </Button>
                  </CardContent>
                </Card>

                {/* Enhanced This Week's Advice */}
                <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="pb-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      This Week's Action Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                          <Leaf className="w-3 h-3 text-white" />
                        </div>
                        Fertilizer Application
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{adaptiveRecs.fertilizer}</p>
                      <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Droplets className="w-3 h-3 text-white" />
                        </div>
                        Irrigation Schedule
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{adaptiveRecs.irrigation}</p>
                      <Button variant="outline" size="sm" className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/50">
                        <Calendar className="w-4 h-4 mr-2" />
                        Set Reminder
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Important Alerts */}
                <Card className="shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-l-4 border-l-amber-500">
                  <CardHeader className="pb-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      Important Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Analysis Complete</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Latest satellite imagery from Sept 5th successfully analyzed
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Weather Advisory</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {weatherAlerts[0] || 'No unusual weather risks detected this week.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Enhanced Detailed Soil Analysis */}
            {showDetailedSoilCard && (
              <div ref={detailedAnalysisRef}>
                <Card className="mt-8 shadow-xl border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                        <PieChartIcon className="w-5 h-5 text-white" />
                      </div>
                      Detailed Soil Analysis Charts
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowDetailedSoilCard(false)} 
                      className="hover:bg-purple-100 dark:hover:bg-purple-900/50"
                    >
                      <X className="w-4 h-4 mr-1" /> Hide Charts
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-12">
                    {/* Macronutrient Analysis */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={adaptiveMacroPie} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={120} 
                              innerRadius={40}
                              label={({name, value}) => `${name}: ${value}`}
                            >
                              {adaptiveMacroPie.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_MACRO[index % COLORS_MACRO.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} kg/ha`, name]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                            Macronutrient Balance (NPK)
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            This analysis shows the critical balance of Nitrogen, Phosphorus, and Potassium in your soil. 
                            For optimal potato growth, maintaining proper NPK ratios is essential for tuber development and plant health.
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            <span className="font-semibold text-amber-800 dark:text-amber-200">Weather Impact</span>
                          </div>
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            Values shown reflect weather-adjusted projections. Heavy rainfall can reduce N/K levels through leaching, 
                            while drought stress may affect nutrient uptake efficiency.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* General Soil Metrics */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={adaptiveGeneralPie} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={120}
                              innerRadius={40}
                              label={({name, value}) => `${name}: ${value}`}
                            >
                              {adaptiveGeneralPie.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_GENERAL[index % COLORS_GENERAL.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                            Soil Foundation Metrics
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            pH and Organic Carbon form the foundation of soil health. These parameters can shift with 
                            weather conditions, affecting nutrient availability and microbial activity.
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-blue-800 dark:text-blue-200">Dynamic Changes</span>
                          </div>
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            Weather patterns influence pH stability and organic matter decomposition rates, 
                            creating short-term variations in these fundamental soil properties.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Micronutrient Analysis */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={adaptiveMicroPie} 
                              dataKey="value" 
                              nameKey="name" 
                              cx="50%" 
                              cy="50%" 
                              outerRadius={120}
                              innerRadius={40}
                              label={({name, value}) => `${name}: ${value} ppm`}
                            >
                              {adaptiveMicroPie.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS_MICRO[index % COLORS_MICRO.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} ppm`, name]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">
                            Essential Micronutrients
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Micronutrients like Zinc and Iron are crucial for enzyme function and chlorophyll synthesis. 
                            Their availability is highly sensitive to soil pH and moisture conditions.
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold text-purple-800 dark:text-purple-200">Sensitivity Alert</span>
                          </div>
                          <p className="text-sm text-purple-800 dark:text-purple-200">
                            Zinc deficiency risks may increase under high humidity and cooler soil conditions. 
                            Monitor plant symptoms and consider foliar applications if needed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        <MapSelector 
          isOpen={showMapSelector} 
          onClose={() => setShowMapSelector(false)} 
          onLocationSelect={handleMapLocationSelect} 
          currentLocation={location} 
        />
      </div>
    </div>
  );
};

export default Dashboard;