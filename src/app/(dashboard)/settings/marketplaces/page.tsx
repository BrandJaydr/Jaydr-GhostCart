'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Store, Wifi, PowerOff, CheckCircle2, RefreshCw, Edit3, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { 
  Card, CardHeader, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input, 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure 
} from '@heroui/react';

interface EBayItem {
  itemId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  status: string;
  viewItemURL: string;
}

interface ConnectionInfo {
  connected: boolean;
  isConfigured: boolean;
  environment?: string;
  connectedAt?: string;
  username?: string;
  feedbackScore?: number;
  positiveFeedbackPercent?: string;
  listingsCount?: number;
  inventory?: EBayItem[];
}

export default function SettingsMarketplacesPage() {
  const [info, setInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ status: string; latencyMs?: number; message?: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Modal state for editing item
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingItem, setEditingItem] = useState<EBayItem | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<string>('');

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ebay/account');
      if (!res.ok) throw new Error('Failed to retrieve eBay connection status.');
      const data = await res.json();
      if (data.status === 'success') {
        setInfo(data.data);
      } else {
        throw new Error(data.error || 'Failed to retrieve connection status.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ebay/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      if (!res.ok) throw new Error('Test request failed.');
      const data = await res.json();
      if (data.status === 'success') {
        setTestResult(data.data);
      } else {
        throw new Error(data.error || 'Test request failed.');
      }
    } catch (err: unknown) {
      setTestResult({ status: 'failed', message: err instanceof Error ? err.message : String(err) });
    } finally {
      setTesting(false);
    }
  };

  const handleConnectSimulator = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ebay/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect_mock' }),
      });
      if (!res.ok) throw new Error('Simulation connection failed.');
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your eBay account? This will revoke active API connection tokens.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ebay/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      if (!res.ok) throw new Error('Failed to disconnect eBay.');
      setTestResult(null);
      await fetchStatus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const openEditModal = (item: EBayItem) => {
    setEditingItem(item);
    setEditPrice(item.price.toString());
    setEditQuantity(item.quantity.toString());
    onOpen();
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    setUpdatingId(editingItem.itemId);
    onClose();
    try {
      const res = await fetch('/api/ebay/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          itemId: editingItem.itemId,
          price: parseFloat(editPrice),
          quantity: parseInt(editQuantity, 10),
        }),
      });
      if (!res.ok) throw new Error('Failed to update inventory.');
      const data = await res.json();
      if (data.status === 'success') {
        // Refetch to get updated list
        await fetchStatus();
      } else {
        throw new Error(data.error || 'Failed to update inventory.');
      }
    } catch (err: unknown) {
      alert(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f3f1ef]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#f3f1ef] min-h-screen">
        <ErrorState title="Settings Error" message={error} onRetry={fetchStatus} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 min-h-screen bg-[#f3f1ef]">
      <PageHeader 
        title="Marketplaces Settings" 
        subtitle="Manage authorizations, test connectivity, and modify active listings on sales channels" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        {/* Connection Controller Card */}
        <Card className="lg:col-span-1 border border-[#e0dbd8] shadow-sm bg-white rounded-xl">
          <CardHeader className="flex items-center gap-3 px-6 pt-6 pb-2 border-b border-[#e0dbd8]/50">
            <Store className="w-6 h-6 text-[#791228]" />
            <div className="flex flex-col">
              <h3 className="font-semibold text-lg text-[#0d0d0d]">eBay Integration</h3>
              <p className="text-xs text-muted-foreground">Sandbox Sales Channel</p>
            </div>
          </CardHeader>
          <CardBody className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <Chip 
                color={info?.connected ? 'success' : 'default'} 
                variant="flat"
                size="sm"
                className="font-medium"
              >
                {info?.connected ? 'CONNECTED' : 'DISCONNECTED'}
              </Chip>
            </div>

            {info?.connected ? (
              <div className="flex flex-col gap-4">
                <div className="rounded-lg bg-gray-50 border border-[#e0dbd8]/70 p-4 text-sm flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account:</span>
                    <span className="font-semibold text-foreground">{info.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Feedback:</span>
                    <span className="text-foreground">{info.feedbackScore} score ({info.positiveFeedbackPercent} Positive)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Env:</span>
                    <span className="capitalize text-foreground font-medium">{info.environment}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    variant="bordered"
                    className="border-[#e0dbd8] text-foreground hover:bg-gray-50 h-10 rounded-lg w-full flex items-center justify-center gap-2 font-medium"
                    onPress={handleTestConnection}
                    isLoading={testing}
                  >
                    <Wifi className="w-4 h-4" />
                    Test Connection Health
                  </Button>
                  <Button 
                    className="bg-red-50 hover:bg-red-100 text-red-700 h-10 rounded-lg w-full flex items-center justify-center gap-2 font-semibold border border-red-200"
                    onPress={handleDisconnect}
                  >
                    <PowerOff className="w-4 h-4" />
                    Disconnect Channel
                  </Button>
                </div>

                {testResult && (
                  <div className={`p-4 rounded-lg border text-sm ${
                    testResult.status === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="font-semibold flex items-center gap-2 mb-1">
                      {testResult.status === 'success' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Connection Health Passed
                        </>
                      ) : (
                        'Connection Test Failed'
                      )}
                    </p>
                    <p className="text-xs">
                      {testResult.latencyMs && `Response latency: ${testResult.latencyMs}ms`}
                      {testResult.message && ` — ${testResult.message}`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect your eBay reseller account to sync live product catalog inventories, round calculations, and automatically publish approved listing drafts.
                </p>

                <div className="flex flex-col gap-2 mt-2">
                  {!info?.isConfigured && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex gap-2 items-start mb-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Credentials not configured in .env</p>
                        <p className="mt-1">Real OAuth connection will fail. Use the simulator below to test database-backed connection state.</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="bg-[#791228] hover:bg-[#55121e] text-white h-10 rounded-lg font-medium shadow w-full"
                    disabled={!info?.isConfigured}
                    onPress={() => {
                      alert('Redirecting to eBay OAuth Consent...');
                    }}
                  >
                    Connect eBay Account
                  </Button>
                  <Button 
                    variant="bordered"
                    className="border-[#e0dbd8] hover:bg-gray-50 text-foreground h-10 rounded-lg w-full font-medium"
                    onPress={handleConnectSimulator}
                  >
                    Connect Simulator (Demo Mode)
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Live listings modifier table */}
        <Card className="lg:col-span-2 border border-[#e0dbd8] shadow-sm bg-white rounded-xl">
          <CardHeader className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-[#e0dbd8]/50">
            <div className="flex flex-col">
              <h3 className="font-semibold text-lg text-[#0d0d0d]">Live eBay Listings</h3>
              <p className="text-xs text-muted-foreground">Manage active marketplace states and modify inventory quantities</p>
            </div>
            {info?.connected && (
              <Button 
                isIconOnly 
                variant="light" 
                radius="full" 
                onPress={fetchStatus}
                title="Refresh Inventory"
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </CardHeader>
          <CardBody className="p-0">
            {!info?.connected ? (
              <div className="py-20 text-center flex flex-col items-center justify-center px-4">
                <Store className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <h4 className="font-semibold text-foreground mb-1">eBay Channel Disconnected</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Connect your channel or start the connection simulator to view and test modifying live listings.
                </p>
              </div>
            ) : (
              <Table 
                aria-label="Active eBay Listings Table"
                className="w-full"
                classNames={{
                  th: "bg-gray-50 text-muted-foreground font-semibold py-3 border-b border-[#e0dbd8]/60",
                  td: "py-4 text-sm border-b border-[#e0dbd8]/40 text-[#0d0d0d]",
                }}
              >
                <TableHeader>
                  <TableColumn>Product Title</TableColumn>
                  <TableColumn>SKU</TableColumn>
                  <TableColumn>Quantity</TableColumn>
                  <TableColumn>Price</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn align="center">Actions</TableColumn>
                </TableHeader>
                <TableBody items={info.inventory ?? []}>
                  {(item) => (
                    <TableRow key={item.itemId}>
                      <TableCell>
                        <div className="flex flex-col gap-1 max-w-[280px]">
                          <span className="font-semibold truncate text-[#0d0d0d]">{item.title}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            ID: {item.itemId}
                            <a 
                              href={item.viewItemURL} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex text-[#791228] hover:underline items-center"
                            >
                              <ArrowUpRight className="w-3 h-3 ml-0.5" />
                            </a>
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">
                          {item.sku}
                        </kbd>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${item.quantity <= 3 ? 'text-amber-600' : 'text-foreground'}`}>
                          {item.quantity} units
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(item.price)}
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color="success" variant="flat">
                          {item.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            isIconOnly
                            variant="light"
                            radius="full"
                            onPress={() => openEditModal(item)}
                            isLoading={updatingId === item.itemId}
                            title="Edit quantity/price"
                          >
                            <Edit3 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Edit Item Dialog */}
      <Modal isOpen={isOpen} onClose={onClose} placement="center">
        <ModalContent className="rounded-xl border border-[#e0dbd8] shadow-lg max-w-md bg-white">
          <ModalHeader className="font-semibold text-lg text-[#0d0d0d] border-b border-[#e0dbd8]/50 px-6 py-4">
            Modify Live eBay Details
          </ModalHeader>
          <ModalBody className="p-6 flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">
              These changes simulate updating listing records on eBay&apos;s Trading API.
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">SKU / Item ID</label>
              <Input 
                value={editingItem?.sku} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                <Input 
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="border border-[#e0dbd8] rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Price (USD)</label>
                <Input 
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="border border-[#e0dbd8] rounded-lg"
                  startContent={<span className="text-muted-foreground text-sm">$</span>}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="px-6 py-4 border-t border-[#e0dbd8]/50 flex justify-end gap-2">
            <Button variant="bordered" onPress={onClose} className="border-[#e0dbd8] text-foreground rounded-lg h-9">
              Cancel
            </Button>
            <Button onPress={handleUpdateItem} className="bg-[#791228] hover:bg-[#55121e] text-white rounded-lg h-9 font-medium">
              Update on eBay
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
