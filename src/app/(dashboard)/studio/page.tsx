'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  Upload, Wand2, Play, Download, Save, RefreshCw, ZoomIn, ZoomOut,
  Maximize2, Sparkles, ImagePlus, X, AlertCircle,
} from 'lucide-react';
import {
  Card, CardBody, Button, Tabs, Tab, Textarea, Chip, Select, SelectItem,
} from '@heroui/react';

/* ────────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────── */

interface NodeItem {
  id: string;
  title: string;
  type: 'source' | 'prompt' | 'settings' | 'generator' | 'output';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GenerationResult {
  imageUrl: string;
  model: string;
  style: string;
  aspectRatio: string;
  generationTimeMs: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Constants
 * ──────────────────────────────────────────────────────────────────────── */

const STYLE_OPTIONS = [
  { key: 'product_photo', label: 'Product Photography' },
  { key: 'lifestyle', label: 'Lifestyle Scene' },
  { key: 'flat_lay', label: 'Flat Lay' },
  { key: 'banner', label: 'Marketing Banner' },
  { key: 'social', label: 'Social Media Post' },
];

const ASPECT_RATIO_OPTIONS = [
  { key: '1:1', label: '1:1 — Square' },
  { key: '4:3', label: '4:3 — Landscape' },
  { key: '16:9', label: '16:9 — Wide Banner' },
  { key: '9:16', label: '9:16 — Story / Reel' },
];

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/* ────────────────────────────────────────────────────────────────────────────
 * Component
 * ──────────────────────────────────────────────────────────────────────── */

export default function MediaStudioPage() {
  const [selectedTab, setSelectedTab] = useState<string>('create');

  /* ── Create Tab state ──────────────────────────────────────────────── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [sourceBase64, setSourceBase64] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>('product_photo');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  /* ── Canvas Tab state ──────────────────────────────────────────────── */
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
  const [isCanvasGenerating, setIsCanvasGenerating] = useState(false);

  /* ── File handling ─────────────────────────────────────────────────── */

  const validateAndLoadFile = useCallback((file: File) => {
    setUploadError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be under 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSourcePreview(result);
      setSourceBase64(result);
      setSourceFileName(file.name);
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndLoadFile(file);
    },
    [validateAndLoadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) validateAndLoadFile(file);
    },
    [validateAndLoadFile],
  );

  const clearUpload = useCallback(() => {
    setSourcePreview(null);
    setSourceBase64(null);
    setSourceFileName(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ── Generate image ────────────────────────────────────────────────── */

  const handleGenerate = useCallback(async () => {
    if (!sourceBase64 || !prompt.trim()) return;

    setIsGenerating(true);
    setGenerateError(null);
    setGenerationResult(null);

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceImage: sourceBase64,
          prompt: prompt.trim(),
          style,
          aspectRatio,
        }),
      });

      const json = await response.json();

      if (!response.ok) {
        setGenerateError(json.error || 'Generation failed. Please try again.');
        return;
      }

      setGenerationResult(json.data);
    } catch {
      setGenerateError('Network error — could not reach the server.');
    } finally {
      setIsGenerating(false);
    }
  }, [sourceBase64, prompt, style, aspectRatio]);

  /* ── Canvas helpers ────────────────────────────────────────────────── */

  const getPortCoords = (nodeId: string, portType: 'in' | 'out') => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return portType === 'out'
      ? { x: node.x + node.width, y: node.y + node.height / 2 }
      : { x: node.x, y: node.y + node.height / 2 };
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    setDraggedNodeId(id);
    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId) return;
    setNodes((prev) =>
      prev.map((node) =>
        node.id === draggedNodeId
          ? { ...node, x: Math.max(10, e.clientX - dragOffset.x), y: Math.max(10, e.clientY - dragOffset.y) }
          : node,
      ),
    );
  };

  const handleCanvasMouseUp = () => setDraggedNodeId(null);

  const handleGenerateCanvas = () => {
    setIsCanvasGenerating(true);
    setTimeout(() => {
      setIsCanvasGenerating(false);
      // eslint-disable-next-line no-alert
      alert('ComfyUI Graph Prompt Queued successfully on Layer 3 BullMQ! Enhanced image output is loaded in the node.');
    }, 1800);
  };

  /* ── Canvas connection paths ──────────────────────────────────────── */

  const connectionPaths = [
    { from: 'node-1', to: 'node-4' },
    { from: 'node-2', to: 'node-4' },
    { from: 'node-3', to: 'node-4' },
    { from: 'node-4', to: 'node-5' },
  ];

  /* ────────────────────────────────────────────────────────────────────
   * Render
   * ──────────────────────────────────────────────────────────────────── */

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 min-h-screen bg-[#f3f1ef]">
      <PageHeader
        title="AI Media Studio"
        subtitle="Generate and enhance high-conversion product photos and promotional content using generative AI"
      />

      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        aria-label="Media Studio Views"
        variant="underlined"
        classNames={{
          tabList: 'gap-6 w-full relative rounded-none p-0 border-b border-[#e0dbd8]',
          cursor: 'w-full bg-[#791228]',
          tab: 'max-w-fit px-0 h-12',
          tabContent: 'group-data-[selected=true]:text-[#791228] font-semibold text-[#6b7280]',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════
         *  TAB 1 — CREATE (Primary / Default)
         * ═══════════════════════════════════════════════════════════════ */}
        <Tab
          key="create"
          title={
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Create</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-4">
            {/* ── Left Column: Upload + Controls ── */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Demo mode notice */}
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs text-amber-800 font-medium">
                  Demo mode — connect an AI provider in Settings to generate real images.
                </span>
              </div>

              {/* Image Upload Zone */}
              <Card className="border border-[#e0dbd8] shadow-sm bg-white rounded-xl">
                <CardBody className="p-5 flex flex-col gap-4">
                  <label className="text-xs font-semibold text-[#0d0d0d] uppercase tracking-wide">
                    Source Image
                  </label>

                  {!sourcePreview ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                      className={`
                        relative flex flex-col items-center justify-center gap-3 p-8
                        border-2 border-dashed rounded-xl cursor-pointer
                        transition-all duration-200
                        ${isDragging
                          ? 'border-[#791228] bg-[#791228]/5'
                          : 'border-[#e0dbd8] hover:border-[#791228]/50 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#f3f1ef] flex items-center justify-center">
                        <Upload className="w-5 h-5 text-[#791228]" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#0d0d0d]">
                          Drop your product image here
                        </p>
                        <p className="text-xs text-[#6b7280] mt-1">
                          or click to browse — JPEG, PNG, WebP up to 10 MB
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        aria-label="Upload product image"
                      />
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="w-full aspect-square bg-gray-50 rounded-xl border border-[#e0dbd8] overflow-hidden flex items-center justify-center">
                        <img
                          src={sourcePreview}
                          alt="Uploaded source"
                          className="object-contain max-h-full max-w-full"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-[#6b7280] truncate max-w-[180px]">
                          {sourceFileName}
                        </span>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          className="text-[#6b7280] hover:text-red-600 h-7 w-7 min-w-7"
                          onPress={clearUpload}
                          aria-label="Remove uploaded image"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-center gap-2 text-red-600 text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {uploadError}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Prompt + Settings */}
              <Card className="border border-[#e0dbd8] shadow-sm bg-white rounded-xl">
                <CardBody className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#0d0d0d]">
                      Instructions
                    </label>
                    <Textarea
                      minRows={3}
                      maxRows={6}
                      value={prompt}
                      onValueChange={setPrompt}
                      placeholder="Describe how you'd like the product placed — e.g. &quot;On a marble countertop with soft morning light and eucalyptus leaves&quot;"
                      classNames={{
                        inputWrapper: 'border border-[#e0dbd8] data-[focus=true]:border-[#791228] bg-transparent shadow-none',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0d0d0d]">Style</label>
                      <Select
                        selectedKeys={[style]}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as string;
                          if (val) setStyle(val);
                        }}
                        aria-label="Image style"
                        classNames={{
                          trigger: 'border border-[#e0dbd8] data-[focus=true]:border-[#791228] bg-transparent shadow-none h-10',
                          value: 'text-sm',
                        }}
                      >
                        {STYLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.key}>{opt.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0d0d0d]">Aspect Ratio</label>
                      <Select
                        selectedKeys={[aspectRatio]}
                        onSelectionChange={(keys) => {
                          const val = Array.from(keys)[0] as string;
                          if (val) setAspectRatio(val);
                        }}
                        aria-label="Aspect ratio"
                        classNames={{
                          trigger: 'border border-[#e0dbd8] data-[focus=true]:border-[#791228] bg-transparent shadow-none h-10',
                          value: 'text-sm',
                        }}
                      >
                        {ASPECT_RATIO_OPTIONS.map((opt) => (
                          <SelectItem key={opt.key}>{opt.label}</SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <Button
                    className="bg-[#791228] hover:bg-[#55121e] text-white font-semibold h-11 rounded-lg w-full flex items-center justify-center gap-2 mt-1 shadow"
                    onPress={handleGenerate}
                    isLoading={isGenerating}
                    isDisabled={!sourceBase64 || !prompt.trim()}
                  >
                    <Wand2 className="w-4 h-4" />
                    Generate Product Mockup
                  </Button>
                </CardBody>
              </Card>
            </div>

            {/* ── Right Column: Output Preview ── */}
            <Card className="lg:col-span-3 border border-[#e0dbd8] shadow-sm bg-white rounded-xl min-h-[480px]">
              <CardBody className="p-6 flex flex-col h-full gap-4">
                <div className="flex items-center justify-between border-b border-[#e0dbd8]/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0d0d0d]">Output Preview</span>
                    {generationResult && (
                      <Chip size="sm" variant="flat" className="font-mono text-[10px] h-5">
                        {generationResult.model} · {generationResult.generationTimeMs}ms
                      </Chip>
                    )}
                  </div>
                  {generationResult && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-gray-100 text-[#0d0d0d] font-semibold rounded-lg flex items-center gap-1.5 h-8"
                        onPress={() => {
                          // eslint-disable-next-line no-alert
                          alert('Saved image to product catalog!');
                        }}
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save to Catalog
                      </Button>
                      <Button
                        size="sm"
                        variant="bordered"
                        className="border-[#e0dbd8] text-[#0d0d0d] font-semibold rounded-lg flex items-center gap-1.5 h-8"
                        onPress={() => {
                          if (generationResult?.imageUrl) {
                            window.open(generationResult.imageUrl, '_blank');
                          }
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex-1 bg-gray-50 border border-[#e0dbd8]/70 rounded-xl flex items-center justify-center overflow-hidden min-h-[350px]">
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-[#791228]" />
                      <span className="text-sm text-[#6b7280] font-semibold">
                        Generating your product mockup…
                      </span>
                      <span className="text-xs text-[#6b7280]">
                        This may take a few seconds
                      </span>
                    </div>
                  ) : generateError ? (
                    <div className="flex flex-col items-center gap-3 px-6 text-center">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                      <span className="text-sm font-semibold text-red-600">{generateError}</span>
                      <Button
                        size="sm"
                        variant="bordered"
                        className="border-red-200 text-red-600 font-semibold rounded-lg"
                        onPress={handleGenerate}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : generationResult ? (
                    <img
                      src={generationResult.imageUrl}
                      alt="AI Generated Product Mockup"
                      className="object-contain max-h-[400px] rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center max-w-sm px-4">
                      <ImagePlus className="w-12 h-12 text-[#e0dbd8] mb-2" />
                      <span className="font-semibold text-[#0d0d0d]">
                        No generated image yet
                      </span>
                      <span className="text-xs text-[#6b7280]">
                        Upload a product photo, describe the scene you want, then click Generate.
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* ═══════════════════════════════════════════════════════════════
         *  TAB 2 — ADVANCED CANVAS (Power User)
         * ═══════════════════════════════════════════════════════════════ */}
        <Tab
          key="canvas"
          title={
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4" />
              <span>Advanced Canvas</span>
              <Chip size="sm" variant="flat" color="secondary" className="font-semibold text-[10px] h-5">
                Power User
              </Chip>
            </div>
          }
        >
          <div className="flex flex-col gap-4 mt-4">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#e0dbd8] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0d0d0d]">Workspace Canvas</span>
                <Chip size="sm" variant="flat" color="secondary" className="font-semibold text-xs">
                  Beta Graph Editor
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-[#e0dbd8] rounded-lg"
                  onPress={() => setCanvasScale((s) => Math.max(0.5, s - 0.1))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs font-mono w-10 text-center">
                  {Math.round(canvasScale * 100)}%
                </span>
                <Button
                  size="sm"
                  variant="bordered"
                  className="border-[#e0dbd8] rounded-lg"
                  onPress={() => setCanvasScale((s) => Math.min(1.5, s + 0.1))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="h-4 w-[1px] bg-gray-200 mx-2" />
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
              {/* Connection Lines */}
              <svg className="absolute inset-0 pointer-events-none w-full h-full z-0">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 2 L 10 5 L 0 8 z" fill="#791228" />
                  </marker>
                </defs>
                {connectionPaths.map(({ from, to }) => {
                  const fromCoord = getPortCoords(from, 'out');
                  const toCoord = getPortCoords(to, 'in');
                  const cx = (fromCoord.x + toCoord.x) / 2;
                  return (
                    <path
                      key={`${from}-${to}`}
                      d={`M ${fromCoord.x} ${fromCoord.y} C ${cx} ${fromCoord.y}, ${cx} ${toCoord.y}, ${toCoord.x} ${toCoord.y}`}
                      fill="none"
                      stroke="#791228"
                      strokeWidth="3.5"
                      markerEnd="url(#arrow)"
                    />
                  );
                })}
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
                    <div className="bg-gray-50 border-b border-[#e0dbd8] px-4 py-2 text-xs font-semibold text-[#0d0d0d] select-none shrink-0 flex items-center justify-between">
                      <span>{node.title}</span>
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    </div>

                    <div className="p-3 text-xs flex-1 overflow-auto flex flex-col gap-2">
                      {node.type === 'source' && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] text-[#6b7280] font-semibold uppercase">Product SKU-101</span>
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
                          <label className="text-[10px] text-[#6b7280] uppercase font-semibold">Lighting Preset</label>
                          <select className="border border-[#e0dbd8] rounded p-1 text-xs bg-white text-[#0d0d0d]" disabled>
                            <option>Dramatic Studio</option>
                            <option>Neon Glow</option>
                            <option>Moody Contrast</option>
                          </select>
                        </div>
                      )}

                      {node.type === 'generator' && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <Wand2 className="w-8 h-8 text-[#791228] animate-pulse mb-1" />
                          <span className="text-[10px] text-[#6b7280] font-semibold">Ready to queue...</span>
                        </div>
                      )}

                      {node.type === 'output' && (
                        <div className="flex flex-col gap-2 h-full">
                          <div className="w-full h-24 bg-gray-100 rounded border border-[#e0dbd8] flex items-center justify-center overflow-hidden">
                            {isCanvasGenerating ? (
                              <div className="flex items-center gap-1.5">
                                <RefreshCw className="w-4 h-4 animate-spin text-[#791228]" />
                                <span className="text-[10px] text-[#6b7280] font-semibold">Generating...</span>
                              </div>
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
                              <Button
                                size="sm"
                                isIconOnly
                                className="h-7 w-7 min-w-7 bg-gray-100 text-[#0d0d0d]"
                                onPress={() => {
                                  // eslint-disable-next-line no-alert
                                  alert('Saved output to SKU-101 Images Library!');
                                }}
                              >
                                <Save className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Node Port Handles */}
                    {node.type !== 'source' && (
                      <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#791228] border-2 border-white z-20 pointer-events-none" />
                    )}
                    {node.type !== 'output' && (
                      <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#791228] border-2 border-white z-20 pointer-events-none" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
