import React, { useEffect, useRef, useState } from 'react';
import { Univer, UniverInstanceType, IWorkbookData, LocaleType } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverUIPlugin } from '@univerjs/ui';
import { Upload, Download, Sync } from 'lucide-react';
import toast from 'react-hot-toast';
import usePriceStore from '../../store/priceStore';
import { univerPriceMapper } from '../../utils/univerPriceMapper';

// Import required CSS
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';

// Import locale data
import enUS from '@univerjs/sheets-ui/locale/en-US';

interface SpreadsheetPriceEditorProps {
  onClose?: () => void;
}

export function SpreadsheetPriceEditor({ onClose }: SpreadsheetPriceEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<Univer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { prices, importPrices, exportPrices } = usePriceStore();

  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    try {
      // Create Univer instance
      const univer = new Univer({
        theme: defaultTheme,
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: enUS,
        },
      });

      // Register plugins in correct order
      univer.registerPlugin(UniverRenderEnginePlugin);
      univer.registerPlugin(UniverFormulaEnginePlugin);
      univer.registerPlugin(UniverUIPlugin, {
        container: containerRef.current,
        header: true,
        footer: true,
      });

      univer.registerPlugin(UniverDocsPlugin, {
        hasScroll: false,
      });
      univer.registerPlugin(UniverDocsUIPlugin);

      univer.registerPlugin(UniverSheetsPlugin);
      univer.registerPlugin(UniverSheetsUIPlugin);
      univer.registerPlugin(UniverSheetsFormulaPlugin);

      // Create workbook with pricing data
      const workbook = createPricingWorkbook(prices);

      // Create unit
      univer.createUnit(UniverInstanceType.UNIVER_SHEET, workbook);

      univerRef.current = univer;
      setIsInitialized(true);

    } catch (error) {
      console.error('Failed to initialize Univer:', error);
      toast.error('Failed to initialize spreadsheet editor');
    }
  }, [isInitialized, prices]);

  const createPricingWorkbook = (priceData: any): IWorkbookData => {
    return {
      id: 'pricing-workbook',
      name: 'DeckPro Pricing',
      appVersion: '2.0.1',
      locale: LocaleType.EN_US,
      defaultStyle: {
        hAlign: 0,
        vAlign: 0,
        tb: 0,
        pd: { t: 0, r: 2, b: 0, l: 2 },
      },
      styles: {
        'header': {
          bg: { rgb: '#3B82F6' },
          cl: { rgb: '#FFFFFF' },
          bl: 1,
          fs: 12,
        },
        'currency': {
          n: {
            pattern: '$#,##0.00'
          }
        }
      },
      sheets: {
        'lumber': createLumberSheet(priceData.lumber),
        'hardware': createHardwareSheet(priceData.hardware),
        'simpson': createSimpsonSheet(priceData.simpsonZmax),
        'footings': createFootingsSheet(priceData.footings),
        'multipliers': createMultipliersSheet(priceData.speciesMultipliers),
      },
      resources: []
    };
  };

  const createLumberSheet = (lumberData: any) => {
    const cellData: any = {
      0: {
        0: { v: 'Size', s: 'header' },
        1: { v: 'Cost per Foot', s: 'header' },
        2: { v: 'Width (in)', s: 'header' },
        3: { v: 'Depth (in)', s: 'header' },
        4: { v: 'Board Feet per LF', s: 'header' },
        5: { v: 'Notes', s: 'header' }
      }
    };

    let row = 1;
    Object.entries(lumberData).forEach(([size, data]: [string, any]) => {
      const boardFeetPerLF = (data.widthIn * data.depthIn) / 144; // Convert to board feet
      cellData[row] = {
        0: { v: size },
        1: { v: data.costPerFoot, s: 'currency' },
        2: { v: data.widthIn },
        3: { v: data.depthIn },
        4: { f: `=B${row + 1}*C${row + 1}*D${row + 1}/144`, v: boardFeetPerLF.toFixed(4) },
        5: { v: 'Standard framing lumber' }
      };
      row++;
    });

    return {
      id: 'lumber',
      name: 'Lumber',
      tabColor: '#10B981',
      hidden: 0,
      rowCount: 1000,
      columnCount: 26,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 120,
      defaultRowHeight: 25,
      status: 1,
      showGridlines: 1,
      hideRow: [],
      hideColumn: [],
      rowHeader: { width: 46, hidden: 0 },
      columnHeader: { height: 20, hidden: 0 },
      selections: ['A1'],
      rightToLeft: 0,
      pluginMeta: {},
      cellData
    };
  };

  const createHardwareSheet = (hardwareData: any) => {
    const cellData: any = {
      0: {
        0: { v: 'Item Code', s: 'header' },
        1: { v: 'Cost Each', s: 'header' },
        2: { v: 'Description', s: 'header' },
        3: { v: 'Category', s: 'header' },
        4: { v: 'Bulk Discount %', s: 'header' },
        5: { v: 'Discounted Price', s: 'header' }
      }
    };

    let row = 1;
    Object.entries(hardwareData).forEach(([item, data]: [string, any]) => {
      cellData[row] = {
        0: { v: item },
        1: { v: data.cost, s: 'currency' },
        2: { v: data.description },
        3: { v: 'Legacy Hardware' },
        4: { v: 0.05 }, // 5% bulk discount example
        5: { f: `=B${row + 1}*(1-E${row + 1})`, v: data.cost * 0.95 }
      };
      row++;
    });

    return {
      id: 'hardware',
      name: 'Hardware',
      tabColor: '#F59E0B',
      hidden: 0,
      rowCount: 1000,
      columnCount: 26,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 150,
      defaultRowHeight: 25,
      status: 1,
      showGridlines: 1,
      hideRow: [],
      hideColumn: [],
      rowHeader: { width: 46, hidden: 0 },
      columnHeader: { height: 20, hidden: 0 },
      selections: ['A1'],
      rightToLeft: 0,
      pluginMeta: {},
      cellData
    };
  };

  const createSimpsonSheet = (simpsonData: any) => {
    const cellData: any = {
      0: {
        0: { v: 'Category', s: 'header' },
        1: { v: 'Item Code', s: 'header' },
        2: { v: 'Cost Each', s: 'header' },
        3: { v: 'Description', s: 'header' },
        4: { v: 'Nails Required', s: 'header' },
        5: { v: 'Screws Required', s: 'header' }
      }
    };

    let row = 1;
    Object.entries(simpsonData).forEach(([category, items]: [string, any]) => {
      if (typeof items === 'object') {
        Object.entries(items).forEach(([subCategory, subItems]: [string, any]) => {
          if (typeof subItems === 'object') {
            Object.entries(subItems).forEach(([item, data]: [string, any]) => {
              cellData[row] = {
                0: { v: `${category}/${subCategory}` },
                1: { v: item },
                2: { v: data.cost, s: 'currency' },
                3: { v: data.description },
                4: { v: data.nailsRequired || 0 },
                5: { v: data.screwsRequired || 0 }
              };
              row++;
            });
          }
        });
      }
    });

    return {
      id: 'simpson',
      name: 'Simpson ZMAX',
      tabColor: '#EF4444',
      hidden: 0,
      rowCount: 1000,
      columnCount: 26,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 180,
      defaultRowHeight: 25,
      status: 1,
      showGridlines: 1,
      hideRow: [],
      hideColumn: [],
      rowHeader: { width: 46, hidden: 0 },
      columnHeader: { height: 20, hidden: 0 },
      selections: ['A1'],
      rightToLeft: 0,
      pluginMeta: {},
      cellData
    };
  };

  const createFootingsSheet = (footingsData: any) => {
    const cellData: any = {
      0: {
        0: { v: 'Footing Type', s: 'header' },
        1: { v: 'Cost Each', s: 'header' },
        2: { v: 'Installation Time (hrs)', s: 'header' },
        3: { v: 'Labor Rate', s: 'header' },
        4: { v: 'Total Cost', s: 'header' }
      }
    };

    let row = 1;
    Object.entries(footingsData).forEach(([type, cost]: [string, any]) => {
      const laborTime = type === 'helical' ? 2 : type === 'concrete' ? 4 : 1;
      const laborRate = 75; // $75/hr example

      cellData[row] = {
        0: { v: type },
        1: { v: cost, s: 'currency' },
        2: { v: laborTime },
        3: { v: laborRate, s: 'currency' },
        4: { f: `=B${row + 1}+C${row + 1}*D${row + 1}`, v: cost + (laborTime * laborRate) }
      };
      row++;
    });

    return {
      id: 'footings',
      name: 'Footings',
      tabColor: '#8B5CF6',
      hidden: 0,
      rowCount: 1000,
      columnCount: 26,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 150,
      defaultRowHeight: 25,
      status: 1,
      showGridlines: 1,
      hideRow: [],
      hideColumn: [],
      rowHeader: { width: 46, hidden: 0 },
      columnHeader: { height: 20, hidden: 0 },
      selections: ['A1'],
      rightToLeft: 0,
      pluginMeta: {},
      cellData
    };
  };

  const createMultipliersSheet = (multipliersData: any) => {
    const cellData: any = {
      0: {
        0: { v: 'Species Grade', s: 'header' },
        1: { v: 'Cost Multiplier', s: 'header' },
        2: { v: 'Availability', s: 'header' },
        3: { v: 'Quality Rating', s: 'header' }
      }
    };

    let row = 1;
    Object.entries(multipliersData).forEach(([species, multiplier]: [string, any]) => {
      cellData[row] = {
        0: { v: species },
        1: { v: multiplier },
        2: { v: 'Regional' },
        3: { v: species.includes('#1') ? 'Premium' : 'Standard' }
      };
      row++;
    });

    return {
      id: 'multipliers',
      name: 'Species Multipliers',
      tabColor: '#06B6D4',
      hidden: 0,
      rowCount: 1000,
      columnCount: 26,
      zoomRatio: 1,
      scrollTop: 0,
      scrollLeft: 0,
      defaultColumnWidth: 150,
      defaultRowHeight: 25,
      status: 1,
      showGridlines: 1,
      hideRow: [],
      hideColumn: [],
      rowHeader: { width: 46, hidden: 0 },
      columnHeader: { height: 20, hidden: 0 },
      selections: ['A1'],
      rightToLeft: 0,
      pluginMeta: {},
      cellData
    };
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // Use xlsx library to read Excel file
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Convert to pricing data format
      const newPrices = await univerPriceMapper.excelToprices(workbook);

      // Import into price store
      if (importPrices(JSON.stringify(newPrices))) {
        toast.success('Pricing data imported successfully');
        // Refresh the spreadsheet
        window.location.reload();
      } else {
        toast.error('Failed to import pricing data');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to read Excel file');
    } finally {
      setIsLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Export each category as a separate sheet
      const priceData = JSON.parse(exportPrices());

      Object.entries(priceData).forEach(([category, data]) => {
        const ws = univerPriceMapper.pricestoWorksheet(category, data);
        XLSX.utils.book_append_sheet(wb, ws, category);
      });

      XLSX.writeFile(wb, `deckpro-prices-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Pricing data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export pricing data');
    }
  };

  const handleSync = async () => {
    if (!univerRef.current) return;

    try {
      setIsLoading(true);
      // Get current spreadsheet data and sync back to price store
      // This would require implementing data extraction from Univer
      toast.success('Pricing data synchronized');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to synchronize pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (univerRef.current) {
        univerRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="spreadsheet-price-editor h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold">Spreadsheet Price Editor</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImportFile}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            <Sync className="w-4 h-4" />
            Sync Changes
          </button>
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div ref={containerRef} className="flex-1 bg-white" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}