import React, { useEffect, useRef, useState } from 'react';
import { Univer, UniverInstanceType, LocaleType } from '@univerjs/core';
import { defaultTheme } from '@univerjs/design';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverUIPlugin } from '@univerjs/ui';
import { Upload, Download, RefreshCw, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import usePriceStore from '../../store/priceStore';
import { excelFileHandler } from '../../utils/excelFileHandler';

// Import required CSS
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';

// Import locale
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

    // Add a small delay to ensure the container is properly rendered
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      try {
        // Create Univer instance
        const univer = new Univer({
          theme: defaultTheme,
          locale: LocaleType.EN_US,
          locales: {
            [LocaleType.EN_US]: enUS,
          },
        });

        // Store reference
        univerRef.current = univer;

        // Register plugins
        univer.registerPlugin(UniverRenderEnginePlugin);
        univer.registerPlugin(UniverUIPlugin, {
          container: containerRef.current,
          header: true,
          toolbar: true,
          footer: true,
        });

        univer.registerPlugin(UniverSheetsPlugin);
        univer.registerPlugin(UniverSheetsUIPlugin);
        univer.registerPlugin(UniverFormulaEnginePlugin);
        univer.registerPlugin(UniverSheetsFormulaPlugin);

        // Create a simple workbook
        const workbook = {
          id: 'pricing-workbook',
          name: 'DeckPro Pricing',
          appVersion: '3.0.0-alpha',
          locale: LocaleType.EN_US,
          defaultStyle: {},
          styles: {},
          sheetOrder: ['sheet-01'],
          sheets: {
            'sheet-01': {
              id: 'sheet-01',
              name: 'Pricing Data',
              tabColor: 'blue',
              hidden: 0,
              rowCount: 1000,
              columnCount: 20,
              zoomRatio: 1,
              scrollTop: 0,
              scrollLeft: 0,
              defaultColumnWidth: 100,
              defaultRowHeight: 25,
              status: 1,
              showGridlines: 1,
              hideRow: [],
              hideColumn: [],
              rowHeader: {
                width: 46,
                hidden: 0,
              },
              columnHeader: {
                height: 20,
                hidden: 0,
              },
              selections: ['A1'],
              rightToLeft: 0,
              pluginMeta: {},
              cellData: createInitialCellData(prices),
            },
          },
        };

        // Create the workbook
        univer.createUnit(UniverInstanceType.UNIVER_SHEET, workbook);

        console.log('[Univer] Successfully initialized');
        setIsInitialized(true);

      } catch (error) {
        console.error('[Univer] Initialization error:', error);
        toast.error('Failed to initialize spreadsheet editor');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (univerRef.current) {
        try {
          univerRef.current.dispose();
        } catch (e) {
          console.error('[Univer] Cleanup error:', e);
        }
      }
    };
  }, [isInitialized]);

  const createInitialCellData = (priceData: any) => {
    const cellData: any = {};

    // Headers
    cellData[0] = {
      0: { v: 'Category' },
      1: { v: 'Item' },
      2: { v: 'Price' },
      3: { v: 'Unit' },
      4: { v: 'Description' },
    };

    let row = 1;

    // Add lumber data
    if (priceData.lumber) {
      Object.entries(priceData.lumber).forEach(([size, data]: [string, any]) => {
        cellData[row] = {
          0: { v: 'Lumber' },
          1: { v: size },
          2: { v: data.costPerFoot },
          3: { v: 'per foot' },
          4: { v: `${data.widthIn}" x ${data.depthIn}"` },
        };
        row++;
      });
    }

    // Add hardware data
    if (priceData.hardware) {
      Object.entries(priceData.hardware).forEach(([item, data]: [string, any]) => {
        cellData[row] = {
          0: { v: 'Hardware' },
          1: { v: item },
          2: { v: data.cost },
          3: { v: 'each' },
          4: { v: data.description },
        };
        row++;
      });
    }

    // Add footings data
    if (priceData.footings) {
      Object.entries(priceData.footings).forEach(([type, data]: [string, any]) => {
        cellData[row] = {
          0: { v: 'Footings' },
          1: { v: type },
          2: { v: data.baseCost },
          3: { v: 'each' },
          4: { v: data.description },
        };
        row++;
      });
    }

    return cellData;
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await excelFileHandler.importFromFile(file);

      if (result.success && result.data) {
        if (importPrices(JSON.stringify(result.data))) {
          toast.success('Pricing data imported successfully');

          if (result.warnings && result.warnings.length > 0) {
            toast('Import completed with warnings: ' + result.warnings.join(', '), {
              duration: 6000,
              icon: '⚠️'
            });
          }

          // Refresh the spreadsheet
          window.location.reload();
        } else {
          toast.error('Failed to save imported pricing data');
        }
      } else {
        toast.error(result.error || 'Failed to import pricing data');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to read file');
    } finally {
      setIsLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const priceData = JSON.parse(exportPrices());
      await excelFileHandler.exportToExcel(priceData);
      toast.success('Pricing data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export pricing data');
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);

      // Get current data from Univer spreadsheet
      if (!univerRef.current) {
        throw new Error('Spreadsheet not initialized');
      }

      const univerInstance = univerRef.current;
      const activeWorkbook = univerInstance.getUniverSheetInstance('pricing-workbook');

      if (!activeWorkbook) {
        throw new Error('Workbook not found');
      }

      const activeSheet = activeWorkbook.getActiveSheet();
      const cellData = activeSheet.getCellMatrix();

      // Convert spreadsheet data back to price format
      const updatedPrices = syncSpreadsheetToStore(cellData);

      // Update the store with changes
      if (importPrices(JSON.stringify(updatedPrices))) {
        toast.success('Pricing data synchronized successfully');
      } else {
        toast.error('Failed to save synchronized data');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to synchronize pricing data');
    } finally {
      setIsLoading(false);
    }
  };

  const syncSpreadsheetToStore = (cellData: any) => {
    const prices = {
      lumber: {},
      hardware: {},
      simpsonZmax: {
        hangers: {},
        angles: {},
        posts: {},
        beams: {}
      },
      footings: {},
      speciesMultipliers: {}
    };

    // Iterate through rows (skip header at row 0)
    cellData.forEach((rowData: any, rowIndex: number) => {
      if (rowIndex === 0) return; // Skip header

      const category = rowData[0]?.v;
      const item = rowData[1]?.v;
      const price = parseFloat(rowData[2]?.v);
      const unit = rowData[3]?.v;
      const description = rowData[4]?.v;

      if (!category || !item || isNaN(price)) return;

      const cat = category.toLowerCase().trim();

      if (cat === 'lumber') {
        const match = item.match(/(\d+)\s*x\s*(\d+)/i);
        prices.lumber[item] = {
          costPerFoot: price,
          widthIn: match ? parseInt(match[1]) : 2,
          depthIn: match ? parseInt(match[2]) : 6
        };
      } else if (cat === 'hardware') {
        prices.hardware[item] = {
          cost: price,
          description: description || item
        };
      } else if (cat === 'footings') {
        prices.footings[item] = {
          baseCost: price,
          description: description || item
        };
      } else if (cat.includes('species') || cat.includes('multipliers')) {
        prices.speciesMultipliers[item] = price;
      } else if (cat.includes('simpson') || cat.includes('zmax')) {
        // Categorize Simpson hardware
        const itemUpper = item.toUpperCase();
        let subCat = 'hangers';
        if (itemUpper.includes('LUS') || itemUpper.includes('HANGER')) subCat = 'hangers';
        else if (itemUpper.includes('A') && itemUpper.includes('ANGLE')) subCat = 'angles';
        else if (itemUpper.includes('POST') || itemUpper.includes('BC')) subCat = 'posts';
        else if (itemUpper.includes('BEAM') || itemUpper.includes('LBV')) subCat = 'beams';

        prices.simpsonZmax[subCat][item] = {
          cost: price,
          description: description || item
        };
      }
    });

    return prices;
  };

  const handleDownloadTemplate = async () => {
    try {
      await excelFileHandler.createSampleTemplate();
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="spreadsheet-price-editor h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold">Spreadsheet Price Editor</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
            title="Download Excel template with sample data"
          >
            <FileDown className="w-4 h-4" />
            Template
          </button>
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
            <RefreshCw className="w-4 h-4" />
            Sync Changes
          </button>
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div
        ref={containerRef}
        className="flex-1 bg-white overflow-hidden"
        style={{ minHeight: '500px', position: 'relative' }}
      />

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