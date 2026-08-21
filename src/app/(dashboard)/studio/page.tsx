'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  Image as ImageIcon, Wand2, Play, Download, Save, RefreshCw, ZoomIn, ZoomOut, Maximize2 
} from 'lucide-react';
import { 
  Card, CardBody, Button, Tabs, Tab, Textarea, Chip 
} from '@heroui/react';

interface NodeItem {
  id: string;
  title: string;
  type: 'source' | 'prompt' | 'settings' | 'generator' | 'output';
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function MediaStudioPage() {
  const [selectedTab, setSelectedTab] = useState<string>('canvas');
  
  // Prompt Generator tab states
  const [selectedProduct, setSelectedProduct] = useState<string>('Wireless Earbuds');
  const [generationPrompt, setGenerationPrompt] = useState<string>('Athletic macro shot of wireless earbuds with water droplets, studio lighting, deep burgundy backdrop');
  const [styleType, setStyleType] = useState<string>('dramatic');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // ComfyUI Canvas nodes coordinates/state
  const [nodes, setNodes] = useState<NodeItem[]>([
    { id: 'node-1', title: 'Supplier Image Source', type: 'source', x: 50, y: 120, width: 220, height: 180 },
    { id: 'node-2', title: 'Background Style Prompt', type: 'prompt', x: 320, y: 50, width: 240, height: 150 },
    { id: 'node-3', title: 'Studio Lighting Config', type: 'settings', x: 320, y: 230, width: 240, height: 140 },
    { id: 'node-4', title: 'AI Media Generator', type: 'generator', x: 620, y: 150, width: 220, height: 160 },
    { id: 'node-5', title: 'Output Enhanced Image', type: 'output', x: 900, y: 130, width: 240, height: 210 },
  ]);

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasScale, setCanvasScale] = useState<number>(1);
  const [isCanvasGenerating, setIsCanvasGenerating] = useState<boolean>(false);

  // Simulated node connection lines coordinates
  const getPortCoords = (nodeId: string, portType: 'in' | 'out') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    if (portType === 'out') {
      return { x: node.x + node.width, y: node.y + node.height / 2 };
    } else {
      return { x: node.x, y: node.y + node.height / 2 };
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    setDraggedNodeId(id);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId) return;
    
    setNodes(prev => prev.map(node => {
      if (node.id === draggedNodeId) {
        return {
          ...node,
          x: Math.max(10, e.clientX - dragOffset.x),
          y: Math.max(10, e.clientY - dragOffset.y),
        };
      }
      return node;
    }));
  };

  const handleCanvasMouseUp = () => {
    setDraggedNodeId(null);
  };

  const handleGenerateDirect = () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    setTimeout(() => {
      setIsGenerating(false);
      // Mock generated image URL (high quality catalog earbud image)
      setGeneratedImage('https://lh3.googleusercontent.com/aida-public/AB6AXuAB3MCwZBtiGF5cggkrgGllgUvjNErZh7kOWGIZdrctw2vvB5_OOFRnzXXv8lZDOw2KtU40sBvdEpvSmLqXBPYw_H2eEya67zeClkQxS5ApYXH5d-tnRADURrl6jSeyQc6xsrytYlQZRiMeWRQEACRSSgQQH4Y3dyCYPMQIPC9kcjwYmLYLKK5XdBpGI6KsH2wOmap2oCPHPsx3vMt_pC5IvcCb38NCpCPK0GN9vXQpyRq_GrwrHULv');
    }, 2000);
  };

  const handleGenerateCanvas = () => {
    setIsCanvasGenerating(true);
    setTimeout(() => {
      setIsCanvasGenerating(false);
      alert('ComfyUI Graph Prompt Queued successfully on Layer 3 BullMQ! Enhanced image output is loaded in the node.');
    }, 1800);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 min-h-screen bg-[#f3f1ef]">
      <PageHeader 
        title="AI Media Studio" 
        subtitle="Generate and enhance high-conversion product photos and promotional showreels using generative models" 
      />

      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key as string)}
        aria-label="Media Studio Views"
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-[#e0dbd8]",
          cursor: "w-full bg-[#791228]",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-[#791228] font-semibold text-muted-foreground"
        }}
      >
        {/* ComfyUI Nodes Canvas View */}
        <Tab 
          key="canvas" 
          title={
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              <span>ComfyUI Node Canvas</span>
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-4">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#e0dbd8] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0d0d0d]">Workspace Canvas</span>
                <Chip size="sm" variant="flat" color="secondary" className="font-semibold text-xs">Beta Graph Editor</Chip>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="bordered" className="border-[#e0dbd8] rounded-lg" onPress={() => setCanvasScale(s => Math.max(0.5, s - 0.1))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono w-10 text-center">{Math.round(canvasScale * 100)}%</span>
                <Button size="sm" variant="bordered" className="border-[#e0dbd8] rounded-lg" onPress={() => setCanvasScale(s => Math.min(1.5, s + 0.1))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="h-4 w-[1px] bg-gray-200 mx-2"></div>
                <Button 
                  size="sm" 
                  className="bg-[#791228] hover:bg-[#55121e] text-white font-semibold rounded-lg flex items-center gap-1.5"
                  onPress={handleGenerateCanvas}
                  isLoading={isCanvasGenerating}
                >
                  <Play className="w-3.5 h-3.5" />
                  Queue Prompt
                </Button>
              </div>
            </div>

            {/* Endless Canvas */}
            <div 
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="relative w-full h-[520px] bg-gray-50 border border-[#e0dbd8] rounded-xl overflow-hidden shadow-inner cursor-grab select-none"
              style={{
                backgroundImage: 'radial-gradient(#e0dbd8 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* Connection Lines Layer */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#791228" />
                  </marker>
                </defs>
                {/* Node 1 -> Node 4 */}
                <path 
                  d={`M ${getPortCoords('node-1', 'out').x} ${getPortCoords('node-1', 'out').y} C ${(getPortCoords('node-1', 'out').x + getPortCoords('node-4', 'in').x) / 2} ${getPortCoords('node-1', 'out').y}, ${(getPortCoords('node-1', 'out').x + getPortCoords('node-4', 'in').x) / 2} ${getPortCoords('node-4', 'in').y}, ${getPortCoords('node-4', 'in').x} ${getPortCoords('node-4', 'in').y}`}
                  fill="none"
                  stroke="#791228"
                  strokeWidth="3.5"
                  markerEnd="url(#arrow)"
                />
                {/* Node 2 -> Node 4 */}
                <path 
                  d={`M ${getPortCoords('node-2', 'out').x} ${getPortCoords('node-2', 'out').y} C ${(getPortCoords('node-2', 'out').x + getPortCoords('node-4', 'in').x) / 2} ${getPortCoords('node-2', 'out').y}, ${(getPortCoords('node-2', 'out').x + getPortCoords('node-4', 'in').x) / 2} ${getPortCoords('node-4', 'in').y}, ${getPortCoords('node-4', 'in').x} ${getPortCoords('node-4', 'in').y}`}
                  fill="none"
                  stroke="#791228"
                  strokeWidth="3.5"
                  markerEnd="url(#arrow)"
                />
                {/* Node 3 -> Node 4 */}
                <path 
                  d={`M ${getPortCoords('node-3', 'out').x} ${getPortCoords('node-3', 'out').y} C ${(getPortCoords('node-3', 'out').x + getPortCoords('node-4', 'in').x) / 2} ${getPortCoords('node-3', 'out').y}, ${(getPortCoords('node-3', 'out').x + getPortCoords('node-4', 'in').x) / 2} ${getPortCoords('node-4', 'in').y}, ${getPortCoords('node-4', 'in').x} ${getPortCoords('node-4', 'in').y}`}
                  fill="none"
                  stroke="#791228"
                  strokeWidth="3.5"
                  markerEnd="url(#arrow)"
                />
                {/* Node 4 -> Node 5 */}
                <path 
                  d={`M ${getPortCoords('node-4', 'out').x} ${getPortCoords('node-4', 'out').y} C ${(getPortCoords('node-4', 'out').x + getPortCoords('node-5', 'in').x) / 2} ${getPortCoords('node-4', 'out').y}, ${(getPortCoords('node-4', 'out').x + getPortCoords('node-5', 'in').x) / 2} ${getPortCoords('node-5', 'in').y}, ${getPortCoords('node-5', 'in').x} ${getPortCoords('node-5', 'in').y}`}
                  fill="none"
                  stroke="#791228"
                  strokeWidth="3.5"
                  markerEnd="url(#arrow)"
                />
              </svg>

              {/* Draggable Node Cards */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top left' }}
              >
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                    className="absolute bg-white rounded-xl border-2 border-[#e0dbd8] hover:border-[#791228] shadow-md pointer-events-auto flex flex-col overflow-hidden"
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: `${node.width}px`,
                      height: `${node.height}px`,
                      cursor: draggedNodeId === node.id ? 'grabbing' : 'grab',
                    }}
                  >
                    <div className="bg-gray-50 border-b border-[#e0dbd8] px-4 py-2 text-xs font-semibold text-foreground select-none shrink-0 flex items-center justify-between">
                      <span>{node.title}</span>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    </div>

                    <div className="p-3 text-xs flex-1 overflow-auto flex flex-col gap-2">
                      {node.type === 'source' && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase">Product SKU-101</span>
                          <div className="w-full h-24 bg-gray-100 rounded border border-[#e0dbd8] flex items-center justify-center overflow-hidden">
                            <img 
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO5psZxTit-LMh1v9yapeQFW36XYDOwnQON8k3B-sUDm-i8QwmtVtA6M7grmD9zflJ8VMqwve6BnzlYrMVR5X2Z2p0O8ATsdgAGnW5xAL-U86IuaBcsAIaGV4WK8DTJQUfb9vWK2A9J25kEVldTElQYqd8w6pqju1-P49Pc0cW93tuuwnEUVHlw7d1TkIrhizcxSoEjS2f58jjgviBNCB392G-qsoBXmeODKJ7V8P916PNj3kZPbxm" 
                              alt="Supplier Earbuds" 
                              className="object-cover h-full"
                            />
                          </div>
                        </div>
                      )}

                      {node.type === 'prompt' && (
                        <Textarea 
                          minRows={3}
                          value="Athletic macro shot with water droplets beading off the matte black earbuds, luxury dark background"
                          disabled
                          className="text-xs bg-gray-50 rounded"
                        />
                      )}

                      {node.type === 'settings' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-muted-foreground uppercase font-semibold">Lighting Preset</label>
                          <select className="border border-[#e0dbd8] rounded p-1 text-xs bg-white text-foreground" disabled>
                            <option>Dramatic Studio</option>
                            <option>Neon Glow</option>
                            <option>Moody Contrast</option>
                          </select>
                        </div>
                      )}

                      {node.type === 'generator' && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <Wand2 className="w-8 h-8 text-[#791228] animate-pulse mb-1" />
                          <span className="text-[10px] text-muted-foreground font-semibold">Ready to queue...</span>
                        </div>
                      )}

                      {node.type === 'output' && (
                        <div className="flex flex-col gap-2 h-full">
                          <div className="w-full h-24 bg-gray-100 rounded border border-[#e0dbd8] flex items-center justify-center overflow-hidden">
                            {isCanvasGenerating ? (
                              <div className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4 animate-spin text-[#791228]" /><span className="text-[10px] text-muted-foreground font-semibold">Generating...</span></div>
                            ) : (
                              <img 
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAB3MCwZBtiGF5cggkrgGllgUvjNErZh7kOWGIZdrctw2vvB5_OOFRnzXXv8lZDOw2KtU40sBvdEpvSmLqXBPYw_H2eEya67zeClkQxS5ApYXH5d-tnRADURrl6jSeyQc6xsrytYlQZRiMeWRQEACRSSgQQH4Y3dyCYPMQIPC9kcjwYmLYLKK5XdBpGI6KsH2wOmap2oCPHPsx3vMt_pC5IvcCb38NCpCPK0GN9vXQpyRq_GrwrHULv" 
                                alt="AI Enhanced Earbuds" 
                                className="object-cover h-full"
                              />
                            )}
                          </div>
                          {!isCanvasGenerating && (
                            <div className="flex gap-1 justify-end shrink-0">
                              <Button size="sm" isIconOnly className="h-7 w-7 min-w-7 bg-gray-100 text-foreground" onClick={() => alert('Saved output to SKU-101 Images Library!')}><Save className="w-3.5 h-3.5" /></Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Node Port Handles */}
                    {node.type !== 'source' && (
                      <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#791228] border-2 border-white z-20 pointer-events-none"></span>
                    )}
                    {node.type !== 'output' && (
                      <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#791228] border-2 border-white z-20 pointer-events-none"></span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tab>

        {/* Direct Image/Video Generator View */}
        <Tab 
          key="generator" 
          title={
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>Direct Prompt Generator</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Input Config Form */}
            <Card className="lg:col-span-1 border border-[#e0dbd8] shadow-sm bg-white rounded-xl">
              <CardBody className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0d0d0d]">Select Target Catalog Product</label>
                  <select 
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="border border-[#e0dbd8] focus:border-[#791228] focus:outline-none rounded-lg p-2.5 text-sm bg-transparent text-foreground cursor-pointer"
                  >
                    <option value="Wireless Earbuds">SoundWave Pro Wireless Earbuds (sku-101)</option>
                    <option value="Power Bank">UltraCharge Power Bank (sku-102)</option>
                    <option value="Office Chair">ErgoFlex Office Chair (sku-103)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0d0d0d]">Generative prompt</label>
                  <Textarea 
                    minRows={4}
                    value={generationPrompt}
                    onChange={(e) => setGenerationPrompt(e.target.value)}
                    className="border border-[#e0dbd8] focus:border-[#791228] focus:outline-none rounded-lg text-sm bg-transparent text-foreground"
                    placeholder="Describe background scene, details, aesthetics, lighting..."
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#0d0d0d]">Output Aspect Ratio</label>
                  <select 
                    value={styleType}
                    onChange={(e) => setStyleType(e.target.value)}
                    className="border border-[#e0dbd8] focus:border-[#791228] focus:outline-none rounded-lg p-2.5 text-sm bg-transparent text-foreground cursor-pointer"
                  >
                    <option value="dramatic">Dramatic Studio Close-up (1:1 Square)</option>
                    <option value="lifestyle">Outdoor Lifestyle Backdrop (4:3)</option>
                    <option value="vertical">Instagram Reels/TikTok Video Frame (9:16)</option>
                  </select>
                </div>

                <Button 
                  className="bg-[#791228] hover:bg-[#55121e] text-white font-semibold h-11 rounded-lg w-full flex items-center justify-center gap-2 mt-2 shadow"
                  onPress={handleGenerateDirect}
                  isLoading={isGenerating}
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Product Image
                </Button>
              </CardBody>
            </Card>

            {/* Generated asset preview display */}
            <Card className="lg:col-span-2 border border-[#e0dbd8] shadow-sm bg-white rounded-xl min-h-[400px]">
              <CardBody className="p-6 flex flex-col justify-between h-full gap-4">
                <div className="flex items-center justify-between border-b border-[#e0dbd8]/50 pb-3">
                  <span className="text-sm font-semibold text-[#0d0d0d]">Output Preview</span>
                  {generatedImage && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-gray-100 text-foreground font-semibold rounded-lg flex items-center gap-1.5 h-8"
                        onPress={() => alert('Saved image to product catalog!')}
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save to Catalog
                      </Button>
                      <Button 
                        size="sm" 
                        variant="bordered"
                        className="border-[#e0dbd8] text-foreground font-semibold rounded-lg flex items-center gap-1.5 h-8"
                        onPress={() => alert('Downloading image...')}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-gray-50 border border-[#e0dbd8]/70 rounded-xl flex items-center justify-center overflow-hidden min-h-[300px]">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-[#791228]" />
                      <span className="text-sm text-muted-foreground font-semibold">Running Stable Diffusion models...</span>
                    </div>
                  ) : generatedImage ? (
                    <img 
                      src={generatedImage} 
                      alt="AI Generated Product" 
                      className="object-contain max-h-[350px] rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center max-w-sm px-4">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-2" />
                      <span className="font-semibold text-[#0d0d0d]">No generated asset yet</span>
                      <span className="text-xs text-muted-foreground">Select a target product, adjust settings, and click Generate.</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
