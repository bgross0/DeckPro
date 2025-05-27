import { useState } from 'react'
import usePriceStore from '../../store/priceStore'
import { X, Download, Upload, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'

export function PriceBookModal() {
  const { 
    priceBookOpen, 
    setPriceBookOpen, 
    prices, 
    updateLumberPrice,
    updatePrice,
    resetPrices,
    exportPrices,
    importPrices
  } = usePriceStore()
  
  const [activeTab, setActiveTab] = useState('lumber')
  
  if (!priceBookOpen) return null
  
  const handleExport = () => {
    const data = exportPrices()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deckpro-prices-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Prices exported successfully')
  }
  
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const text = await file.text()
          if (importPrices(text)) {
            toast.success('Prices imported successfully')
          } else {
            toast.error('Failed to import prices')
          }
        } catch (error) {
          toast.error('Failed to read file')
        }
      }
    }
    input.click()
  }
  
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all prices to defaults?')) {
      resetPrices()
      toast.success('Prices reset to defaults')
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Price Book</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={() => setPriceBookOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          {['lumber', 'hardware', 'footings', 'multipliers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'lumber' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 mb-4">Lumber Prices (per linear foot)</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(prices.lumber).map(([size, data]) => (
                  <div key={size} className="flex items-center justify-between">
                    <label className="font-medium">{size}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={data.costPerFoot}
                        onChange={(e) => updateLumberPrice(size, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'hardware' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-4">Legacy Hardware</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(prices.hardware).map(([item, data]) => (
                    <div key={item} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item}</div>
                        <div className="text-sm text-gray-600">{data.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={data.cost}
                          onChange={(e) => updatePrice('hardware', item, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-4">Simpson ZMAX Hardware</h3>
                {Object.entries(prices.simpsonZmax).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">{category}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(items).map(([item, data]) => (
                        <div key={item} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item}</div>
                            <div className="text-sm text-gray-600">{data.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={data.cost}
                              onChange={(e) => updatePrice('simpsonZmax', `${category}.${item}`, parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'footings' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 mb-4">Footing Prices</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(prices.footings).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium capitalize">{type.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-600">{data.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={data.baseCost}
                        onChange={(e) => updatePrice('footings', type, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'multipliers' && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700 mb-4">Species Cost Multipliers</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(prices.speciesMultipliers).map(([species, multiplier]) => (
                  <div key={species} className="flex items-center justify-between">
                    <label className="font-medium">{species}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">×</span>
                      <input
                        type="number"
                        step="0.01"
                        value={multiplier}
                        onChange={(e) => updatePrice('speciesMultipliers', species, parseFloat(e.target.value) || 1)}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}