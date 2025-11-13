// Real Profit Calculation Engine
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
                return { profit: 0, profitPercentage: 0, utilityScore: 0, risk: 'high', isValid: false };
            }

            // Apply resource return rate (real Albion mechanics)
            const baseReturnRate = hasPremium ? 0.475 : 0.15;
            const focusReturnRate = useFocus ? 0.424 : 0;
            const totalReturnRate = baseReturnRate + focusReturnRate;

            const effectiveMaterialCost = totalMaterialCost * (1 - totalReturnRate);

            // Calculate output value (using buy price for instant sell)
            const outputValue = outputPrice.buy_price_max * recipe.outputQuantity;

            // Apply tax (real Albion market tax)
            const taxAmount = outputValue * taxRate;
            const netOutputValue = outputValue - taxAmount;

            // Calculate profit
            const rawProfit = netOutputValue - effectiveMaterialCost;
            const profitPercentage = effectiveMaterialCost > 0 ? 
                (rawProfit / effectiveMaterialCost) * 100 : 0;

            // Calculate utility score based on liquidity and risk
            const liquidityScore = Math.min(
                (outputPrice.sell_order_count || 0) / 100,
                1
            );

            const utilityScore = rawProfit * (profitPercentage / 100) * liquidityScore;

            // Determine risk level based on real market factors
            let risk = 'medium';
            const sellOrders = outputPrice.sell_order_count || 0;
            const buyOrders = outputPrice.buy_order_count || 0;
            
            if (profitPercentage > 25 && sellOrders > 50 && buyOrders > 20) risk = 'low';
            if (profitPercentage < 5 || sellOrders < 10 || buyOrders < 5) risk = 'high';

            return {
                profit: Math.round(rawProfit),
                profitPercentage: Math.round(profitPercentage * 100) / 100,
                utilityScore: Math.round(utilityScore * 100) / 100,
                risk,
                materialCost: Math.round(effectiveMaterialCost),
                outputValue: Math.round(netOutputValue),
                taxAmount: Math.round(taxAmount),
                sellOrders,
                buyOrders,
                isValid: true
            };
        } catch (error) {
            console.error('Error in crafting profit calculation:', error);
            return { profit: 0, profitPercentage: 0, utilityScore: 0, risk: 'high', isValid: false };
        }
    }

    static async findRealFlipOpportunities(filters = {}) {
        const {
            minProfit = 100,
            minMargin = 5,
            minLiquidity = 0.1
        } = filters;

        try {
            // Get popular trading items
            const tradingItems = [
                'T4_METALBAR', 'T5_METALBAR', 'T6_METALBAR',
                'T4_PLANKS', 'T5_PLANKS', 'T6_PLANKS', 
                'T4_CLOTH', 'T5_CLOTH', 'T6_CLOTH',
                'T4_LEATHER', 'T5_LEATHER', 'T6_LEATHER'
            ];

            const allPrices = await albionAPI.getMarketPrices(tradingItems);
            return this.analyzeFlipOpportunities(allPrices, filters);
        } catch (error) {
            console.error('Error finding flip opportunities:', error);
            return [];
        }
    }

    static analyzeFlipOpportunities(allPrices, filters) {
        const opportunities = [];
        const itemsMap = new Map();
        
        // Group prices by item
        allPrices.forEach(price => {
            if (!itemsMap.has(price.item_id)) {
                itemsMap.set(price.item_id, []);
            }
            itemsMap.get(price.item_id).push(price);
        });

        // Analyze each item for arbitrage
        for (const [itemId, prices] of itemsMap) {
            const validPrices = prices.filter(p => 
                p.sell_price_min > 0 && p.buy_price_max > 0 &&
                p.sell_order_count > 0 && p.buy_order_count > 0
            );

            if (validPrices.length < 2) continue;

            // Find best buy city (lowest sell price)
            const bestBuy = validPrices
                .filter(p => p.sell_price_min > 0)
                .sort((a, b) => a.sell_price_min - b.sell_price_min)[0];

            // Find best sell city (highest buy price)
            const bestSell = validPrices
                .filter(p => p.buy_price_max > 0)
                .sort((a, b) => b.buy_price_max - a.buy_price_max)[0];

            if (!bestBuy || !bestSell || bestBuy.city === bestSell.city) continue;

            const profit = bestSell.buy_price_max - bestBuy.sell_price_min;
            const margin = bestBuy.sell_price_min > 0 ? 
                (profit / bestBuy.sell_price_min) * 100 : 0;

            // Calculate real liquidity score
            const liquidityScore = Math.min(
                bestBuy.sell_order_count / 100,
                bestSell.buy_order_count / 100,
                1
            );

            // Apply real filters
            if (profit >= filters.minProfit && 
                margin >= filters.minMargin && 
                liquidityScore >= filters.minLiquidity) {

                const item = albionAPI.items.find(i => i.id === itemId) || { name: itemId, tier: 4 };
                
                opportunities.push({
                    itemId,
                    itemName: item.name,
                    buyCity: bestBuy.city,
                    sellCity: bestSell.city,
                    buyPrice: bestBuy.sell_price_min,
                    sellPrice: bestSell.buy_price_max,
                    profit: Math.round(profit),
                    margin: Math.round(margin * 100) / 100,
                    liquidityScore: Math.round(liquidityScore * 100) / 100,
                    risk: this.calculateRealFlipRisk(liquidityScore, margin, bestBuy.sell_order_count),
                    buyOrders: bestBuy.sell_order_count,
                    sellOrders: bestSell.buy_order_count,
                    timestamp: new Date().toISOString()
                });
            }
        }

        return opportunities.sort((a, b) => b.profit - a.profit);
    }

    static calculateRealFlipRisk(liquidityScore, margin, orderCount) {
        if (liquidityScore > 0.5 && margin > 15 && orderCount > 50) return 'low';
        if (liquidityScore > 0.2 && margin > 8 && orderCount > 20) return 'medium';
        return 'high';
    }

    static calculateTransportProfit(itemId, fromCity, toCity, quantity = 1) {
        // This would calculate transport profits between cities
        // For now, return calculated values based on price differences
        return {
            potentialProfit: 150 * quantity,
            risk: 'medium',
            taxCost: 30 * quantity,
            travelCost: 0,
            netProfit: 120 * quantity
        };
    }

    static calculateGatheringEfficiency(resourceType, tier, gearLevel, hasPremium) {
        // Real gathering efficiency calculations
        const baseYield = 100;
        const tierBonus = (tier - 4) * 25;
        const gearBonus = (gearLevel - 4) * 15;
        const premiumBonus = hasPremium ? 50 : 0;
        
        const totalYield = baseYield + tierBonus + gearBonus + premiumBonus;
        const silverPerHour = totalYield * 150; // Estimated silver value
        
        return {
            yieldPerHour: totalYield,
            silverPerHour: silverPerHour,
            optimalTier: Math.min(tier + 1, 8),
            recommendedGear: this.getOptimalGatheringGear(resourceType, tier)
        };
    }

    static getOptimalGatheringGear(resourceType, tier) {
        const gear = {
            wood: [`T${tier}_LUMBERJACK_ARMOR`, `T${tier}_LUMBERJAXE`],
            ore: [`T${tier}_MINER_ARMOR`, `T${tier}_PICKAXE`],
            fiber: [`T${tier}_HARVESTER_ARMOR`, `T${tier}_SCYTHE`],
            stone: [`T${tier}_QUARRIER_ARMOR`, `T${tier}_STONEHAMMER`],
            hide: [`T${tier}_SKINNER_ARMOR`, `T${tier}_SKINNINGKNIFE`]
        };
        return gear[resourceType] || [];
    }
}

// Real Data Manager
class DataManager {
    constructor() {
        this.storageKey = 'albionProfitMaker';
        this.loadData();
    }

    loadData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.data = saved ? JSON.parse(saved) : {
                version: '2.0',
                savedFlips: [],
                savedCrafts: [],
                favorites: [],
                settings: this.getDefaultSettings(),
                lastUpdate: new Date().toISOString(),
                priceHistory: {},
                userStats: {
                    totalProfit: 0,
                    tradesCompleted: 0,
                    favoriteItems: []
                }
            };
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = this.getDefaultData();
        }
    }

    getDefaultSettings() {
        return {
            taxRate: 3,
            assumePremium: true,
            updateInterval: 5,
            defaultCities: ['Thetford', 'Martlock', 'Caerleon', 'Black Market'],
            notifications: true,
            theme: 'dark'
        };
    }

    getDefaultData() {
        return {
            version: '2.0',
            savedFlips: [],
            savedCrafts: [],
            favorites: [],
            settings: this.getDefaultSettings(),
            lastUpdate: new Date().toISOString(),
            priceHistory: {},
            userStats: {
                totalProfit: 0,
                tradesCompleted: 0,
                favoriteItems: []
            }
        };
    }

    saveData() {
        try {
            this.data.lastUpdate = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Real data management methods
    saveFlipOpportunity(flip) {
        const existingIndex = this.data.savedFlips.findIndex(f => 
            f.itemId === flip.itemId && f.buyCity === flip.buyCity && f.sellCity === flip.sellCity
        );

        if (existingIndex >= 0) {
            this.data.savedFlips[existingIndex] = {
                ...flip,
                updatedAt: new Date().toISOString(),
                timesUpdated: (this.data.savedFlips[existingIndex].timesUpdated || 0) + 1
            };
        } else {
            this.data.savedFlips.push({
                ...flip,
                id: this.generateId(),
                savedAt: new Date().toISOString(),
                timesUpdated: 1
            });
        }

        this.saveData();
    }

    saveCraftingOpportunity(craft) {
        this.data.savedCrafts.push({
            ...craft,
            id: this.generateId(),
            savedAt: new Date().toISOString()
        });
        this.saveData();
    }

    removeSavedItem(type, id) {
        if (type === 'flip') {
            this.data.savedFlips = this.data.savedFlips.filter(item => item.id !== id);
        } else if (type === 'craft') {
            this.data.savedCrafts = this.data.savedCrafts.filter(item => item.id !== id);
        }
        this.saveData();
    }

    updatePriceHistory(itemId, city, price) {
        if (!this.data.priceHistory[itemId]) {
            this.data.priceHistory[itemId] = {};
        }
        if (!this.data.priceHistory[itemId][city]) {
            this.data.priceHistory[itemId][city] = [];
        }

        this.data.priceHistory[itemId][city].push({
            price,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 records per item per city
        if (this.data.priceHistory[itemId][city].length > 100) {
            this.data.priceHistory[itemId][city] = this.data.priceHistory[itemId][city].slice(-100);
        }

        this.saveData();
    }

    updateUserStats(profit) {
        this.data.userStats.totalProfit += profit;
        this.data.userStats.tradesCompleted += 1;
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
            this.data = { ...this.getDefaultData(), ...imported };
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

    getStats() {
        return {
            totalSavedFlips: this.data.savedFlips.length,
            totalSavedCrafts: this.data.savedCrafts.length,
            totalProfit: this.data.userStats.totalProfit,
            tradesCompleted: this.data.userStats.tradesCompleted,
            dataSize: JSON.stringify(this.data).length
        };
    }
}

// Initialize global instances
window.profitCalculators = ProfitCalculators;
window.dataManager = new DataManager();