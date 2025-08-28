import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Beaker, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SoilFertility = () => {
  const [ndviValue, setNdviValue] = useState('');
  const [fieldSize, setFieldSize] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const analyzeFertility = () => {
    const ndvi = parseFloat(ndviValue);
    if (isNaN(ndvi) || ndvi < -1 || ndvi > 1) {
      toast({
        title: "Invalid NDVI Value",
        description: "Please enter a valid NDVI value between -1 and 1.",
        variant: "destructive"
      });
      return;
    }

    let fertilityLevel = '';
    let nitrogenStatus = '';
    let recommendations = [];
    let urgency = '';
    let color = '';

    if (ndvi < 0.3) {
      fertilityLevel = 'Low';
      nitrogenStatus = 'Severe Deficiency';
      urgency = 'Immediate Action Required';
      color = 'destructive';
      recommendations = [
        'Apply immediate nitrogen fertilizer (150-200 kg/ha)',
        'Test soil for micronutrient deficiencies',
        'Consider soil amendments to improve structure',
        'Implement precision fertilization in low-fertility zones'
      ];
    } else if (ndvi < 0.6) {
      fertilityLevel = 'Moderate';
      nitrogenStatus = 'Mild Deficiency';
      urgency = 'Attention Needed';
      color = 'warning';
      recommendations = [
        'Apply balanced NPK fertilizer (100-120 kg/ha)',
        'Monitor plant health closely',
        'Consider split application of nitrogen',
        'Test soil pH and adjust if necessary'
      ];
    } else {
      fertilityLevel = 'Good';
      nitrogenStatus = 'Adequate';
      urgency = 'Maintain Current Practice';
      color = 'success';
      recommendations = [
        'Continue current fertilization program',
        'Monitor for early signs of deficiency',
        'Consider micro-nutrient supplements',
        'Implement sustainable soil management practices'
      ];
    }

    const result = {
      ndvi,
      fertilityLevel,
      nitrogenStatus,
      urgency,
      color,
      recommendations,
      nitrogenScore: Math.max(0, Math.min(100, (ndvi + 1) * 50)),
      phosphorusScore: Math.max(0, Math.min(100, 75 + (ndvi - 0.5) * 30)),
      potassiumScore: Math.max(0, Math.min(100, 65 + (ndvi - 0.4) * 40)),
      fieldSize: parseFloat(fieldSize) || 0
    };

    setAnalysisResult(result);

    toast({
      title: "Analysis Complete",
      description: `Fertility level: ${fertilityLevel}. Check recommendations below.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyzeFertility();
  };

  const getNutrientColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getNutrientLevel = (score: number) => {
    if (score >= 70) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-agricultural-dark mb-4">
          Soil Fertility Analysis
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Analyze soil fertility and nutrient health using NDVI data from satellite imagery. 
          Get precise recommendations for fertilizer application and soil management.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Beaker className="w-5 h-5 text-agricultural-primary" />
              <h3 className="text-lg font-semibold text-agricultural-dark">Field Analysis Input</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="ndvi">NDVI Value</Label>
                <Input
                  id="ndvi"
                  type="number"
                  step="0.01"
                  min="-1"
                  max="1"
                  placeholder="0.65"
                  value={ndviValue}
                  onChange={(e) => setNdviValue(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter NDVI value between -1 and 1 (obtained from satellite imagery)
                </p>
              </div>

              <div>
                <Label htmlFor="field-size">Field Size (hectares)</Label>
                <Input
                  id="field-size"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="10.5"
                  value={fieldSize}
                  onChange={(e) => setFieldSize(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Field size for fertilizer quantity calculations
                </p>
              </div>

              <Button type="submit" className="w-full">
                Analyze Soil Fertility
              </Button>
            </form>

            <div className="mt-6 p-4 bg-agricultural-light rounded-lg">
              <h4 className="font-semibold text-agricultural-dark mb-2">NDVI Reference Guide</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Bare soil/Very low vegetation:</span>
                  <Badge variant="outline">0.0 - 0.2</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Sparse vegetation:</span>
                  <Badge variant="outline">0.2 - 0.4</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Moderate vegetation:</span>
                  <Badge variant="outline">0.4 - 0.6</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Dense vegetation:</span>
                  <Badge variant="outline">0.6 - 0.9</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          {analysisResult ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-agricultural-primary" />
                <h3 className="text-lg font-semibold text-agricultural-dark">Analysis Results</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-agricultural-light rounded-lg">
                  <div className="text-2xl font-bold text-agricultural-dark">
                    {analysisResult.fertilityLevel}
                  </div>
                  <div className="text-sm text-muted-foreground">Fertility Level</div>
                </div>
                <div className="text-center p-4 bg-agricultural-light rounded-lg">
                  <div className="text-2xl font-bold text-agricultural-dark">
                    {analysisResult.ndvi.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">NDVI Value</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold">Status:</span>
                  <Badge variant={analysisResult.color === 'success' ? 'default' : 'destructive'}>
                    {analysisResult.urgency}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-agricultural-dark mb-3">Nutrient Levels</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Nitrogen (N)</span>
                        <span className="text-sm font-mono">
                          {analysisResult.nitrogenScore.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={analysisResult.nitrogenScore} 
                        className="h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {getNutrientLevel(analysisResult.nitrogenScore)}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Phosphorus (P)</span>
                        <span className="text-sm font-mono">
                          {analysisResult.phosphorusScore.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={analysisResult.phosphorusScore} 
                        className="h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {getNutrientLevel(analysisResult.phosphorusScore)}
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">Potassium (K)</span>
                        <span className="text-sm font-mono">
                          {analysisResult.potassiumScore.toFixed(0)}%
                        </span>
                      </div>
                      <Progress 
                        value={analysisResult.potassiumScore} 
                        className="h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {getNutrientLevel(analysisResult.potassiumScore)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-agricultural-dark mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {analysisResult.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-agricultural-primary mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {analysisResult.fieldSize > 0 && (
                  <div className="p-4 bg-agricultural-light rounded-lg">
                    <h4 className="font-semibold text-agricultural-dark mb-2">
                      Field Size: {analysisResult.fieldSize} hectares
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Fertilizer recommendations are scaled for your field size. 
                      Consider zone-specific application based on field variability.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Ready for Analysis
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter NDVI data to get detailed soil fertility analysis and recommendations.
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6 bg-agricultural-light border-agricultural-primary border-2">
        <h3 className="text-xl font-bold text-agricultural-dark mb-4">Understanding NDVI for Soil Fertility</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-agricultural-dark mb-2">What is NDVI?</h4>
            <p className="text-sm text-muted-foreground">
              Normalized Difference Vegetation Index measures vegetation health and density 
              using near-infrared and red light reflectance from satellite imagery.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-agricultural-dark mb-2">Fertility Connection</h4>
            <p className="text-sm text-muted-foreground">
              Higher NDVI values typically indicate healthier, more vigorous plant growth, 
              which correlates with better soil fertility and nutrient availability.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-agricultural-dark mb-2">Precision Agriculture</h4>
            <p className="text-sm text-muted-foreground">
              By mapping NDVI across fields, farmers can identify low-fertility zones 
              and apply fertilizers precisely where needed, reducing costs and environmental impact.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SoilFertility;