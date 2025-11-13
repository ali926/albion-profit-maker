// Profit Calculation Engine
class ProfitCalculators {
    static calculateCraftingProfit(recipe, materialPrices, outputPrice, options = {}) {
        const {
            taxRate = 0.03,
            hasPremium = true,
            useFocus = false,
            useJournals = false
        } = options;

        try {
            // Calculate total material cost
            let totalMaterialCost = 0;
            let missingMaterials = false;

            for (const ingredient of recipe.ingredients) {
                const materialPrice = materialPrices[ingredient.itemId];
                if (!materialPrice || materialPrice.sell_price_min === 0) {
                    missingMaterials = true;
                    continue;
                }
                totalMaterialCost += materialPrice.sell_price_min * ingredient.quantity;
            }

            if (missingMaterials || !outputPrice || outputPrice.buy_price_max === 0) {
                return {
                    profit: 0,
                    profitPercentage: 0,
                    utilityScore: 0,
                    risk: 'high',
                    isValid: false
                };
            }

            // Apply resource return rate
            const baseReturnRate = hasPremium ? 0.475 : 0.15;
            const focusReturnRate = useFocus ? 0.424 : 0;
            const totalReturnRate = baseReturnRate + focusReturnRate;

            const effectiveMaterialCost = totalMaterialCost * (1 - totalReturnRate);

            // Calculate output value (using buy price for instant sell)
            const outputValue = outputPrice.buy_price_max * recipe.outputQuantity;

            // Apply tax
            const taxAmount = outputValue * taxRate;
            const netOutputValue = outputValue - taxAmount;

            // Calculate profit
            const rawProfit = netOutputValue - effectiveMaterialCost;
            const profitPercentage = effectiveMaterialCost > 0 ? 
                (rawProfit / effectiveMaterialCost) * 100 : 0;

            // Calculate utility score (profit adjusted by liquidity and risk)
            const liquidityScore = Math.min(
                outputPrice.sell_order_count / 100,
                materialPrices.liquidityScore || 1
            );

            const utilityScore = rawProfit * (profitPercentage / 100) * liquidityScore;

            // Determine risk level
            let risk = 'medium';
            if (profitPercentage > 25) risk = 'low';
            if (profitPercentage < 5 || outputPrice.sell_order_count < 10) risk = 'high';

            return {
                profit: Math.round(rawProfit),
                profitPercentage: Math.round(profitPercentage * 100) / 100,
                utilityScore: Math.round(utilityScore * 100) / 100,
                risk,
                materialCost: Math.round(effectiveMaterialCost),
                outputValue: Math.round(netOutputValue),
                taxAmount: Math.round(taxAmount),
                isValid: true
            };
        } catch (error) {
            console.error('Error in crafting profit calculation:', error);
            return {
                profit: 0,
                profitPercentage: 0,
                utilityScore: 0,
                risk: 'high',
                isValid: false
            };
        }
    }

    static findFlipOpportunities(allPrices, filters = {}) {
        const {
            minProfit = 100,
            minMargin = 5,
            minLiquidity = 0
        } = filters;

        const opportunities = [];

        try {
            // Group prices by item
            const itemsMap = new Map();
            
            allPrices.forEach(price => {
                if (!itemsMap.has(price.item_id)) {
                    itemsMap.set(price.item_id, []);
                }
                itemsMap.get(price.item_id).push(price);
            });

            // Analyze each item for flip opportunities
            for (const [itemId, prices] of itemsMap) {
                // Find best buy price (lowest sell price)
                const bestBuy = prices
                    .filter(p => p.sell_price_min > 0 && p.sell_order_count > 0)
                    .sort((a, b) => a.sell_price_min - b.sell_price_min)[0];

                // Find best sell price (highest buy price)
                const bestSell = prices
                    .filter(p => p.buy_price_max > 0 && p.buy_order_count > 0)
                    .sort((a, b) => b.buy_price_max - a.buy_price_max)[0];

                if (!bestBuy || !bestSell || bestBuy.city === bestSell.city) {
                    continue;
                }

                const profit = bestSell.buy_price_max - bestBuy.sell_price_min;
                const margin = bestBuy.sell_price_min > 0 ? 
                    (profit / bestBuy.sell_price_min) * 100 : 0;

                // Calculate liquidity score
                const liquidityScore = Math.min(
                    bestBuy.sell_order_count / 100,
                    bestSell.buy_order_count / 100
                );

                // Apply filters
                if (profit >= minProfit && 
                    margin >= minMargin && 
                    liquidityScore >= minLiquidity) {

                    opportunities.push({
                        itemId,
                        itemName: this.getItemName(itemId),
                        buyCity: bestBuy.city,
                        sellCity: bestSell.city,
                        buyPrice: bestBuy.sell_price_min,
                        sellPrice: bestSell.buy_price_max,
                        profit: Math.round(profit),
                        margin: Math.round(margin * 100) / 100,
                        liquidityScore: Math.round(liquidityScore * 100) / 100,
                        risk: this.calculateFlipRisk(liquidityScore, margin),
                        buyOrders: bestBuy.sell_order_count,
                        sellOrders: bestSell.buy_order_count
                    });
                }
            }

            // Sort by profit (descending)
            return opportunities.sort((a, b) => b.profit - a.profit);
        } catch (error) {
            console.error('Error finding flip opportunities:', error);
            return [];
        }
    }

    static calculateFlipRisk(liquidityScore, margin) {
        if (liquidityScore > 0.5 && margin > 15) return 'low';
        if (liquidityScore > 0.2 && margin > 8) return 'medium';
        return 'high';
    }

    static getItemName(itemId) {
        // Simple mapping - in a real app, you'd have a comprehensive item database
        const nameMap = {
            'T4_ORE': 'Iron Ore',
            'T5_ORE': 'Steel Ore',
            'T6_ORE': 'Titanium Ore',
            'T4_METALBAR': 'Iron Bar',
            'T5_METALBAR': 'Steel Bar',
            'T6_METALBAR': 'Titanium Steel Bar',
            'T4_WOOD': 'Birch Logs',
            'T5_WOOD': 'Chestnut Logs',
            'T4_PLANKS': 'Birch Planks',
            'T5_PLANKS': 'Chestnut Planks',
            'T4_CLOTH': 'Cotton',
            'T5_CLOTH': 'Fine Cloth',
            'T4_LEATHER': 'Medium Leather',
            'T5_LEATHER': 'Hard Leather',
            'T4_ARMOR_CLOTH_SET2': 'Scholar Robe',
            'T5_ARMOR_CLOTH_SET2': 'Scholar Robe'
        };
        return nameMap[itemId] || itemId;
    }

    static calculateGatheringProfit(resourceType, tier, options = {}) {
        // This would calculate gathering profits based on resource type, tier, and market prices
        // For now, return sample data
        return {
            silverPerHour: 150000 + (tier * 25000),
            risk: tier > 6 ? 'high' : tier > 4 ? 'medium' : 'low',
            recommendedGear: this.getGatheringGear(resourceType, tier),
            optimalZones: this.getOptimalZones(resourceType, tier)
        };
    }

    static getGatheringGear(resourceType, tier) {
        const gear = {
            wood: [`T${tier}_LUMBERJACK_ARMOR`, `T${tier}_LUMBERJAXE`],
            ore: [`T${tier}_MINER_ARMOR`, `T${tier}_PICKAXE`],
            fiber: [`T${tier}_HARVESTER_ARMOR`, `T${tier}_SCYTHE`],
            stone: [`T${tier}_QUARRIER_ARMOR`, `T${tier}_STONEHAMMER`],
            hide: [`T${tier}_SKINNER_ARMOR`, `T${tier}_SKINNINGKNIFE`]
        };
        return gear[resourceType] || [];
    }

    static getOptimalZones(resourceType, tier) {
        // Simplified zone recommendations
        if (tier <= 4) return ['Blue Zones - Safe'];
        if (tier <= 6) return ['Yellow Zones - Medium Risk'];
        return ['Red/Black Zones - High Risk (High Reward)'];
    }
}

// Data storage and management
class DataManager {
    constructor() {
        this.storageKey = 'albionProfitMakerData';
        this.loadData();
    }

    loadData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.data = saved ? JSON.parse(saved) : {
                savedFlips: [],
                savedCrafts: [],
                favorites: [],
                settings: {
                    taxRate: 3,
                    assumePremium: true,
                    updateInterval: 5
                },
                lastUpdate: null
            };
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = this.getDefaultData();
        }
    }

    saveData() {
        try {
            this.data.lastUpdate = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    getDefaultData() {
        return {
            savedFlips: [],
            savedCrafts: [],
            favorites: [],
            settings: {
                taxRate: 3,
                assumePremium: true,
                updateInterval: 5
            },
            lastUpdate: null
        };
    }

    // Flip management
    saveFlip(flipOpportunity) {
        this.data.savedFlips.push({
            ...flipOpportunity,
            savedAt: new Date().toISOString(),
            id: this.generateId()
        });
        this.saveData();
    }

    removeFlip(flipId) {
        this.data.savedFlips = this.data.savedFlips.filter(flip => flip.id !== flipId);
        this.saveData();
    }

    // Craft management
    saveCraft(craftOpportunity) {
        this.data.savedCrafts.push({
            ...craftOpportunity,
            savedAt: new Date().toISOString(),
            id: this.generateId()
        });
        this.saveData();
    }

    // Settings management
    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.saveData();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    exportData() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        return URL.createObjectURL(dataBlob);
    }

    importData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.data = { ...this.data, ...imported };
            this.saveData();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearData() {
        this.data = this.getDefaultData();
        this.saveData();
    }
}

// Create global instances
window.profitCalculators = ProfitCalculators;
window.dataManager = new DataManager();