import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Satellite, Sprout, Map, BarChart3 } from 'lucide-react';
import MapComponent from '@/components/MapComponent';
import GrowthStages from '@/components/GrowthStages';
import SoilFertility from '@/components/SoilFertility';

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-agricultural-primary rounded-lg">
                <Satellite className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-agricultural-dark">
                  AgriSight AI
                </h1>
                <p className="text-sm text-muted-foreground">
                  Potato Crop Growth & Nutrient Management
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-agricultural-light text-agricultural-dark border-agricultural-primary">
              Powered by Satellite AI
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-agricultural-light">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Field Mapping
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center gap-2">
              <Sprout className="w-4 h-4" />
              Growth Stages
            </TabsTrigger>
            <TabsTrigger value="fertility" className="flex items-center gap-2">
              <Satellite className="w-4 h-4" />
              Soil Fertility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-agricultural-dark mb-4">
                AI-Powered Potato Crop Management
              </h2>
              <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Harness the power of satellite imagery and artificial intelligence to optimize 
                your potato crop growth stages and nutrient management. Get precise, data-driven 
                recommendations for irrigation and fertilization.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 border-agricultural-primary border-2 bg-agricultural-light">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-agricultural-primary rounded-lg">
                    <Satellite className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-agricultural-dark">
                    Satellite Analysis
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Process Sentinel-2 satellite images with NDVI/NDRE vegetation indices 
                  to monitor crop health and growth patterns.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real-time satellite data processing</li>
                  <li>• NDVI & NDRE vegetation analysis</li>
                  <li>• Multi-spectral image interpretation</li>
                </ul>
              </Card>

              <Card className="p-6 border-stage-mid border-2 bg-green-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-stage-mid rounded-lg">
                    <Sprout className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-agricultural-dark">
                    Growth Classification
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Automatically classify potato fields into three distinct growth stages 
                  for optimal timing of agricultural interventions.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vegetative growth detection</li>
                  <li>• Tuber bulking identification</li>
                  <li>• Maturation stage monitoring</li>
                </ul>
              </Card>

              <Card className="p-6 border-agricultural-accent border-2 bg-yellow-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-agricultural-accent rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-agricultural-dark">
                    Nutrient Management
                  </h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Map nutrient health and identify low-fertility zones for 
                  precise fertilizer application and resource optimization.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nitrogen level assessment</li>
                  <li>• Soil fertility mapping</li>
                  <li>• Precision fertilization</li>
                </ul>
              </Card>
            </div>

            <Card className="p-8 bg-gradient-to-r from-agricultural-light to-white border-agricultural-primary border-2">
              <div className="text-center space-y-4">
                <h3 className="text-2xl font-bold text-agricultural-dark">
                  Why Choose AgriSight AI?
                </h3>
                <div className="grid md:grid-cols-4 gap-6 mt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-agricultural-primary mb-2">85%</div>
                    <div className="text-sm text-muted-foreground">Yield Optimization</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-agricultural-primary mb-2">60%</div>
                    <div className="text-sm text-muted-foreground">Cost Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-agricultural-primary mb-2">40%</div>
                    <div className="text-sm text-muted-foreground">Resource Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-agricultural-primary mb-2">95%</div>
                    <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="mapping">
            <MapComponent />
          </TabsContent>

          <TabsContent value="growth">
            <GrowthStages />
          </TabsContent>

          <TabsContent value="fertility">
            <SoilFertility />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-agricultural-dark text-white py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Satellite className="w-5 h-5" />
              <span className="font-semibold">AgriSight AI</span>
            </div>
            <p className="text-sm text-gray-300">
              Empowering farmers with AI-driven insights for sustainable potato cultivation
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
