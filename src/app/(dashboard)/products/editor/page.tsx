'use client';

import { z } from 'zod';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, Trash2, Download, CloudUpload, CheckCircle, AlertTriangle, Sparkles 
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Card, CardBody, Spinner } from '@heroui/react';

interface LocalProductRow {
  id: string;
  title: string;
  sku: string;
  priceCents: number;
  sourceUrl: string;
  availability: 'in_stock' | 'out_of_stock';
}

type EditableField = 'title' | 'sku' | 'priceCents' | 'sourceUrl' | 'availability';

interface ActiveCell {
  rowId: string;
  field: EditableField;
}

const ProductRowSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  sku: z.string()
    .min(1, 'SKU is required')
    .regex(/^[A-Z0-9_-]+$/i, 'SKU must be alphanumeric (dashes/underscores allowed)'),
  priceCents: z.number().positive('Price must be greater than 0'),
  sourceUrl: z.string().url('Invalid URL format').min(1, 'Source URL is required'),
});

export default function CSVEditorPage() {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  // Initial table rows
  const [rows, setRows] = useState<LocalProductRow[]>([
    {
      id: 'row-1',
      title: 'SoundWave Pro Wireless Earbuds',
      sku: 'SWPRO-001',
      priceCents: 4999,
      sourceUrl: 'https://supplier.com/item-1',
      availability: 'in_stock',
    },
    {
      id: 'row-2',
      title: 'UltraCharge Power Bank 10000mAh',
      sku: 'UCHG-002',
      priceCents: 2999,
      sourceUrl: 'https://supplier.com/item-2',
      availability: 'in_stock',
    },
    {
      id: 'row-3',
      title: 'ErgoFlex Adaptive Office Chair',
      sku: 'ERGF-003',
      priceCents: 18999,
      sourceUrl: 'https://supplier.com/item-3',
      availability: 'in_stock',
    },
  ]);

  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Validation error logs
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [importStatus, setImportStatus] = useState<{ progress: number; total: number; active: boolean; done: boolean } | null>(null);
  
  // Ref for the active input element
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  const validateRow = (row: LocalProductRow): Record<string, string> => {
    const rowErrors: Record<string, string> = {};
    
    const result = ProductRowSchema.safeParse(row);
    if (!result.success) {
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          rowErrors[issue.path[0].toString()] = issue.message;
        }
      });
    }
    
    // Check SKU duplicates manually since it requires checking against other rows
    const duplicateSkus = rows.filter(r => r.id !== row.id && r.sku.toLowerCase() === row.sku.toLowerCase());
    if (duplicateSkus.length > 0) {
      rowErrors.sku = 'SKU must be unique';
    }

    return rowErrors;
  };

  const runAllValidations = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    rows.forEach((row) => {
      const rowErrs = validateRow(row);
      Object.entries(rowErrs).forEach(([field, msg]) => {
        newErrors[`${row.id}-${field}`] = msg;
        isValid = false;
      });
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleCellClick = (rowId: string, field: EditableField, value: string | number) => {
    setActiveCell({ rowId, field });
    setEditValue(value.toString());
  };

  const handleCellSave = () => {
    if (!activeCell) return;
    
    const { rowId, field } = activeCell;
    const updatedRows = rows.map((row) => {
      if (row.id !== rowId) return row;
      
      let val: string | number = editValue;
      if (field === 'priceCents') {
        const floatVal = parseFloat(editValue);
        val = isNaN(floatVal) ? 0 : Math.round(floatVal * 100);
      }
      
      const newRow = { ...row, [field]: val };
      
      // Remove any specific validation error on save
      const newErrors = { ...errors };
      const rowErrs = validateRow(newRow);
      
      // Update cell error list
      Object.keys(row).forEach((f) => {
        const key = `${rowId}-${f}`;
        if (rowErrs[f]) {
          newErrors[key] = rowErrs[f];
        } else {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);

      return newRow;
    });

    setRows(updatedRows);
    setActiveCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      setActiveCell(null);
    }
  };

  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    const newRow: LocalProductRow = {
      id: newId,
      title: '',
      sku: `SKU-${Math.floor(Math.random() * 8000) + 1000}`,
      priceCents: 0,
      sourceUrl: '',
      availability: 'in_stock',
    };
    setRows([...rows, newRow]);
    setActiveCell({ rowId: newId, field: 'title' });
    setEditValue('');
  };

  const handleDeleteRow = (id: string) => {
    setRows(rows.filter((row) => row.id !== id));
    // Clear errors associated with the deleted row
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach((key) => {
      if (key.startsWith(id)) delete newErrors[key];
    });
    setErrors(newErrors);
  };

  const handleBulkMarkup = (percentage: number) => {
    const updatedRows = rows.map((row) => ({
      ...row,
      priceCents: Math.round(row.priceCents * (1 + percentage / 100)),
    }));
    setRows(updatedRows);
  };

  const handleExportCSV = () => {
    if (!runAllValidations()) {
      alert('Cannot export: Please fix the highlighted validation errors first.');
      return;
    }

    const headers = ['title', 'sku', 'supplier_price_cents', 'source_url', 'availability'];
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => 
        [
          `"${row.title.replace(/"/g, '""')}"`,
          `"${row.sku}"`,
          row.priceCents,
          `"${row.sourceUrl}"`,
          row.availability,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ghostcart_products.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportToGhostCart = async () => {
    if (!runAllValidations()) {
      alert('Cannot import: Please fix validation errors first.');
      return;
    }

    setImportStatus({ progress: 0, total: rows.length, active: true, done: false });
    
    // Simulate importing each item via API calls
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Enqueueing simulated imports in developer sandbox
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: row.sourceUrl,
            supplierId: 'mock-supplier',
            idempotencyKey: `local_${row.sku}_${Date.now()}`,
          }),
        });
        
        if (!response.ok) {
          console.warn(`Failed to import item with SKU ${row.sku}`);
        }
      } catch (err) {
        console.error(err);
      }
      setImportStatus((prev) => prev ? { ...prev, progress: i + 1 } : null);
    }

    setImportStatus((prev) => prev ? { ...prev, done: true } : null);
    setTimeout(() => {
      setImportStatus(null);
      router.push('/products');
    }, 1500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 min-h-screen bg-[#f3f1ef]" aria-label="CSV Editor">
      <div className="flex items-center gap-2">
        <Link href="/products" className="p-1.5 rounded-full hover:bg-white border border-transparent hover:border-[#e0dbd8] transition-all text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-semibold text-muted-foreground">Back to Catalog</span>
      </div>

      <PageHeader 
        title="Product Table Creator" 
        subtitle="Create, edit, and validate product listings interactively, and export to CSV or import to catalog"
        action={
          <div className="flex gap-2">
            <Button 
              variant="bordered"
              className="border-[#e0dbd8] bg-white hover:bg-gray-50 text-foreground font-semibold rounded-lg h-9 flex items-center gap-1.5"
              onPress={handleExportCSV}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button 
              className="bg-[#791228] hover:bg-[#55121e] text-white font-semibold rounded-lg h-9 flex items-center gap-1.5"
              onPress={handleImportToGhostCart}
            >
              <CloudUpload className="w-4 h-4" />
              Import to Catalog
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Bulk Modifier Banner */}
        <Card className="border border-[#e0dbd8] shadow-sm bg-white rounded-xl">
          <CardBody className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#791228]" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#0d0d0d]">Bulk Price Adjustments</span>
                <span className="text-xs text-muted-foreground">Adjust all supplier cost bases simultaneously</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="bordered" className="border-[#e0dbd8] rounded-lg text-xs" onPress={() => handleBulkMarkup(5)}>
                +5% Markup
              </Button>
              <Button size="sm" variant="bordered" className="border-[#e0dbd8] rounded-lg text-xs" onPress={() => handleBulkMarkup(10)}>
                +10% Markup
              </Button>
              <Button size="sm" variant="bordered" className="border-[#e0dbd8] rounded-lg text-xs" onPress={() => handleBulkMarkup(-5)}>
                -5% Discount
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Table Editor */}
        <Card className="border border-[#e0dbd8] shadow-sm bg-white rounded-xl overflow-visible">
          <CardBody className="p-0 overflow-visible">
            <Table 
              aria-label="CSV Interactive Editor Table"
              className="w-full"
              classNames={{
                th: "bg-gray-50 text-muted-foreground font-semibold py-3 border-b border-[#e0dbd8]/60",
                td: "p-0 h-14 border-b border-[#e0dbd8]/40 text-[#0d0d0d]",
              }}
            >
              <TableHeader>
                <TableColumn width="30%">Product Title</TableColumn>
                <TableColumn width="20%">SKU Identifier</TableColumn>
                <TableColumn width="15%">Supplier Price</TableColumn>
                <TableColumn width="25%">Source URL</TableColumn>
                <TableColumn width="10%">Availability</TableColumn>
                <TableColumn align="center" width="5%">Actions</TableColumn>
              </TableHeader>
              <TableBody items={rows}>
                {(row) => (
                  <TableRow key={row.id}>
                    {/* Title Cell */}
                    <TableCell>
                      <div className="p-2 h-full flex items-center justify-between group min-h-[48px]">
                        {activeCell?.rowId === row.id && activeCell?.field === 'title' ? (
                          <input 
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 border border-[#791228] focus:outline-none focus:ring-1 focus:ring-[#791228] rounded text-sm bg-transparent"
                          />
                        ) : (
                          <div 
                            onClick={() => handleCellClick(row.id, 'title', row.title)}
                            className="w-full h-full cursor-pointer px-2 py-1 select-none hover:bg-gray-50 rounded flex justify-between items-center"
                          >
                            <span className={row.title ? 'text-foreground' : 'text-muted-foreground italic'}>
                              {row.title || 'Click to edit title'}
                            </span>
                            {errors[`${row.id}-title`] && (
                              <span title={errors[`${row.id}-title`]} className="shrink-0 flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* SKU Cell */}
                    <TableCell>
                      <div className="p-2 h-full flex items-center min-h-[48px]">
                        {activeCell?.rowId === row.id && activeCell?.field === 'sku' ? (
                          <input 
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 border border-[#791228] focus:outline-none focus:ring-1 focus:ring-[#791228] rounded font-mono text-xs bg-transparent"
                          />
                        ) : (
                          <div 
                            onClick={() => handleCellClick(row.id, 'sku', row.sku)}
                            className="w-full h-full cursor-pointer px-2 py-1 select-none hover:bg-gray-50 rounded font-mono text-xs flex justify-between items-center"
                          >
                            <span>{row.sku || 'EDIT-SKU'}</span>
                            {errors[`${row.id}-sku`] && (
                              <span title={errors[`${row.id}-sku`]} className="shrink-0 flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Price Cell */}
                    <TableCell>
                      <div className="p-2 h-full flex items-center min-h-[48px]">
                        {activeCell?.rowId === row.id && activeCell?.field === 'priceCents' ? (
                          <input 
                            ref={inputRef}
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 border border-[#791228] focus:outline-none focus:ring-1 focus:ring-[#791228] rounded text-sm bg-transparent"
                          />
                        ) : (
                          <div 
                            onClick={() => handleCellClick(row.id, 'priceCents', (row.priceCents / 100).toFixed(2))}
                            className="w-full h-full cursor-pointer px-2 py-1 select-none hover:bg-gray-50 rounded font-medium flex justify-between items-center text-foreground"
                          >
                            <span>{formatPrice(row.priceCents / 100)}</span>
                            {errors[`${row.id}-priceCents`] && (
                              <span title={errors[`${row.id}-priceCents`]} className="shrink-0 flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Source URL Cell */}
                    <TableCell>
                      <div className="p-2 h-full flex items-center min-h-[48px]">
                        {activeCell?.rowId === row.id && activeCell?.field === 'sourceUrl' ? (
                          <input 
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={handleKeyDown}
                            className="w-full px-2 py-1 border border-[#791228] focus:outline-none focus:ring-1 focus:ring-[#791228] rounded text-xs bg-transparent"
                          />
                        ) : (
                          <div 
                            onClick={() => handleCellClick(row.id, 'sourceUrl', row.sourceUrl)}
                            className="w-full h-full cursor-pointer px-2 py-1 select-none hover:bg-gray-50 rounded text-xs text-muted-foreground truncate flex justify-between items-center"
                          >
                            <span className="truncate max-w-[200px]">{row.sourceUrl || 'Click to edit URL'}</span>
                            {errors[`${row.id}-sourceUrl`] && (
                              <span title={errors[`${row.id}-sourceUrl`]} className="shrink-0 flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Availability Cell */}
                    <TableCell>
                      <div className="p-2 h-full flex items-center min-h-[48px]">
                        <select
                          value={row.availability}
                          onChange={(e) => {
                            const val = e.target.value as 'in_stock' | 'out_of_stock';
                            setRows(rows.map(r => r.id === row.id ? { ...r, availability: val } : r));
                          }}
                          className="w-full px-2 py-1 border border-[#e0dbd8] focus:outline-none focus:border-[#791228] rounded text-xs bg-transparent cursor-pointer"
                        >
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>
                    </TableCell>

                    {/* Delete Cell */}
                    <TableCell>
                      <div className="flex justify-center items-center h-full min-h-[48px]">
                        <Button 
                          isIconOnly 
                          variant="light" 
                          radius="full" 
                          onPress={() => handleDeleteRow(row.id)}
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {rows.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No rows present. Click &quot;Add New Row&quot; to start adding products.
              </div>
            )}
          </CardBody>
        </Card>

        {/* Row Add trigger */}
        <Button 
          className="border border-dashed border-[#e0dbd8] hover:border-[#791228] text-muted-foreground hover:text-[#791228] bg-white h-12 rounded-xl flex items-center justify-center gap-2 font-medium"
          onPress={handleAddRow}
        >
          <Plus className="w-5 h-5" />
          Add New Product Row
        </Button>
      </div>

      {/* Import overlay */}
      {importStatus?.active && (
        <div className="fixed inset-0 bg-[#0d0d0d]/40 flex items-center justify-center z-50">
          <Card className="border border-[#e0dbd8] max-w-sm w-full shadow-lg p-6 bg-white rounded-xl text-center flex flex-col items-center gap-4">
            {importStatus.done ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-500" />
                <h4 className="font-semibold text-lg text-foreground">Import Complete!</h4>
                <p className="text-sm text-muted-foreground">Redirecting to catalog...</p>
              </>
            ) : (
              <>
                <Spinner size="lg" />
                <h4 className="font-semibold text-lg text-foreground">Importing Products...</h4>
                <p className="text-sm text-muted-foreground">
                  Processed {importStatus.progress} of {importStatus.total} rows
                </p>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-[#791228] h-full transition-all duration-300"
                    style={{ width: `${(importStatus.progress / importStatus.total) * 100}%` }}
                  ></div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
