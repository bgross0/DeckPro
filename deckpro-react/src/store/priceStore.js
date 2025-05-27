import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { materials as defaultMaterials } from '../data/materials'

const usePriceStore = create(
  persist(
    (set, get) => ({
      // Price data - initially populated from default materials
      prices: {
        lumber: { ...defaultMaterials.lumber },
        hardware: { ...defaultMaterials.hardware },
        simpsonZmax: { ...defaultMaterials.simpsonZmax },
        footings: { ...defaultMaterials.footings },
        speciesMultipliers: { ...defaultMaterials.speciesMultipliers }
      },
      
      // UI state
      priceBookOpen: false,
      editingCategory: null,
      
      // Actions
      updatePrice: (category, item, price) => {
        set((state) => {
          const newPrices = { ...state.prices };
          
          // Handle nested categories
          if (category === 'simpsonZmax' && item.includes('.')) {
            const [subCategory, itemKey] = item.split('.');
            if (!newPrices.simpsonZmax[subCategory]) {
              newPrices.simpsonZmax[subCategory] = {};
            }
            newPrices.simpsonZmax[subCategory][itemKey] = {
              ...newPrices.simpsonZmax[subCategory][itemKey],
              cost: price
            };
          } else if (typeof newPrices[category][item] === 'object') {
            newPrices[category][item] = {
              ...newPrices[category][item],
              cost: price
            };
          } else {
            newPrices[category][item] = price;
          }
          
          return { prices: newPrices };
        });
      },
      
      updateLumberPrice: (size, costPerFoot) => {
        set((state) => ({
          prices: {
            ...state.prices,
            lumber: {
              ...state.prices.lumber,
              [size]: {
                ...state.prices.lumber[size],
                costPerFoot
              }
            }
          }
        }));
      },
      
      setPriceBookOpen: (open) => set({ priceBookOpen: open }),
      setEditingCategory: (category) => set({ editingCategory: category }),
      
      // Get price for a specific item
      getPrice: (category, item) => {
        const state = get();
        
        if (category === 'simpsonZmax' && item.includes('.')) {
          const [subCategory, itemKey] = item.split('.');
          return state.prices.simpsonZmax[subCategory]?.[itemKey]?.cost || 0;
        }
        
        const categoryPrices = state.prices[category];
        if (!categoryPrices) return 0;
        
        const itemData = categoryPrices[item];
        if (typeof itemData === 'object' && itemData.cost !== undefined) {
          return itemData.cost;
        } else if (typeof itemData === 'object' && itemData.costPerFoot !== undefined) {
          return itemData.costPerFoot;
        }
        
        return itemData || 0;
      },
      
      // Reset prices to defaults
      resetPrices: () => {
        set({
          prices: {
            lumber: { ...defaultMaterials.lumber },
            hardware: { ...defaultMaterials.hardware },
            simpsonZmax: { ...defaultMaterials.simpsonZmax },
            footings: { ...defaultMaterials.footings },
            speciesMultipliers: { ...defaultMaterials.speciesMultipliers }
          }
        });
      },
      
      // Export prices as JSON
      exportPrices: () => {
        const state = get();
        return JSON.stringify(state.prices, null, 2);
      },
      
      // Import prices from JSON
      importPrices: (jsonString) => {
        try {
          const imported = JSON.parse(jsonString);
          set({ prices: imported });
          return true;
        } catch (error) {
          console.error('Failed to import prices:', error);
          return false;
        }
      }
    }),
    {
      name: 'deckpro-prices',
      version: 1
    }
  )
)

export default usePriceStore