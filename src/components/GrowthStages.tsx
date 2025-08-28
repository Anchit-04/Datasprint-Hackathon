import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprout, TreePine, Wheat } from 'lucide-react';

const GrowthStages = () => {
  const stages = [
    {
      id: 1,
      title: "Vegetative Growth (Early Stage)",
      icon: <Sprout className="w-8 h-8" />,
      emoji: "🌿",
      ndviRange: "Below 0.4",
      description: "Initial stage where potato plants emerge from the ground.",
      characteristics: [
        "Low vegetation cover with visible bare soil",
        "Field appears brown or sparsely green",
        "Plants are establishing root systems",
        "Critical for proper plant establishment"
      ],
      aiIndicators: "NDVI and NDRE values are low (typically below 0.4) due to minimal chlorophyll reflection.",
      recommendations: [
        "Ensure adequate soil moisture for germination",
        "Monitor for pest emergence",
        "Apply starter fertilizers if needed",
        "Avoid soil compaction"
      ],
      colorClass: "border-stage-early bg-orange-50",
      badgeClass: "bg-stage-early text-white"
    },
    {
      id: 2,
      title: "Tuber Bulking (Mid-Stage)",
      icon: <TreePine className="w-8 h-8" />,
      emoji: "🥔",
      ndviRange: "0.6 to 0.9",
      description: "The most critical and active growth phase for potato development.",
      characteristics: [
        "Dense, lush canopy completely covers the ground",
        "Field appears uniformly green and vibrant",
        "Plants focus energy on tuber development",
        "Peak biomass accumulation period"
      ],
      aiIndicators: "NDVI and NDRE values are at their highest (0.6 to 0.9). NDRE is particularly useful for high chlorophyll content detection.",
      recommendations: [
        "Maintain consistent soil moisture",
        "Monitor nutrient levels closely",
        "Apply potassium for tuber quality",
        "Control weeds to reduce competition"
      ],
      colorClass: "border-stage-mid bg-green-50",
      badgeClass: "bg-stage-mid text-white"
    },
    {
      id: 3,
      title: "Maturation/Senescence (Late Stage)",
      icon: <Wheat className="w-8 h-8" />,
      emoji: "🍂",
      ndviRange: "Below 0.4",
      description: "Plants mature and prepare for harvest as foliage begins to die back.",
      characteristics: [
        "Leaves start turning yellow and brown",
        "Canopy begins to thin out significantly",
        "Field has patchy, yellowish-brown appearance",
        "Tubers reach full maturity"
      ],
      aiIndicators: "NDVI and NDRE values decline significantly as chlorophyll breaks down and plant vigor decreases.",
      recommendations: [
        "Reduce irrigation to promote skin set",
        "Monitor for harvest readiness",
        "Plan harvest timing carefully",
        "Prepare storage facilities"
      ],
      colorClass: "border-stage-late bg-yellow-50",
      badgeClass: "bg-stage-late text-white"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-agricultural-dark mb-4">
          Potato Growth Stage Classification
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Our AI system classifies potato fields into three distinct growth stages using satellite imagery 
          and vegetation indices like NDVI and NDRE. Each stage requires specific management practices 
          for optimal yield and resource efficiency.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3">
        {stages.map((stage) => (
          <Card key={stage.id} className={`p-6 ${stage.colorClass} border-2 hover:shadow-lg transition-shadow`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/80">
                    {stage.icon}
                  </div>
                  <span className="text-2xl">{stage.emoji}</span>
                </div>
                <Badge className={stage.badgeClass}>
                  Stage {stage.id}
                </Badge>
              </div>

              <div>
                <h3 className="text-xl font-bold text-agricultural-dark mb-2">
                  {stage.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stage.description}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-agricultural-dark mb-2">NDVI Range</h4>
                  <Badge variant="outline" className="font-mono">
                    {stage.ndviRange}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-agricultural-dark mb-2">Visual Characteristics</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {stage.characteristics.map((char, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-agricultural-primary mt-1">•</span>
                        {char}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-agricultural-dark mb-2">AI Indicators</h4>
                  <p className="text-sm text-muted-foreground bg-white/60 p-3 rounded-lg">
                    {stage.aiIndicators}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-agricultural-dark mb-2">Management Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {stage.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-agricultural-primary mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-agricultural-light border-agricultural-primary border-2">
        <h3 className="text-xl font-bold text-agricultural-dark mb-4">How Our AI Classification Works</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-agricultural-dark mb-2">Data Sources</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-primary rounded-full"></span>
                Sentinel-2 satellite imagery
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-primary rounded-full"></span>
                NDVI/NDRE vegetation indices
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-primary rounded-full"></span>
                Soil fertility datasets
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-primary rounded-full"></span>
                Historical yield and weather data
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-agricultural-dark mb-2">Key Benefits</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-accent rounded-full"></span>
                Optimized irrigation timing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-accent rounded-full"></span>
                Precise fertilizer application
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-accent rounded-full"></span>
                Maximized crop yield
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-agricultural-accent rounded-full"></span>
                Reduced resource costs
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GrowthStages;