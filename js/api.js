// Real Albion Online Data API Service
class AlbionAPI {
    constructor() {
        this.baseURL = 'https://west.albion-online-data.com/api/v2/stats';
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
        this.items = [];
        this.recipes = [];
        this.loadItemDatabase();
    }

    async loadItemDatabase() {
        try {
            const response = await fetch('./data/items.json');
            const data = await response.json();
            this.items = data.items;
            this.recipes = data.recipes;
            console.log(`Loaded ${this.items.length} items and ${this.recipes.length} recipes`);
        } catch (error) {
            console.error('Failed to load item database:', error);
            // Fallback to embedded data
            this.items = [
                {"id": "T4_ORE", "name": "Iron Ore", "category": "resource", "tier": 4},
                {"id": "T5_ORE", "name": "Steel Ore", "category": "resource", "tier": 5},
                {"id": "T4_METALBAR", "name": "Iron Bar", "category": "refined", "tier": 4},
                {"id": "T5_METALBAR", "name": "Steel Bar", "category": "refined", "tier": 5}
            ];
        }
    }

    async getMarketPrices(itemIds, locations = ['Thetford', 'Fort Sterling', 'Lymhurst', 'Bridgewatch', 'Martlock', 'Black Market']) {
        try {
            if (!Array.isArray(itemIds)) itemIds = [itemIds];
            
            const cacheKey = `prices_${itemIds.join('_')}_${locations.join('_')}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const locationParam = locations.join(',');
            const itemParam = itemIds.join(',');
            
            const url = `${this.baseURL}/prices/${itemParam}?locations=${locationParam}`;
            
            console.log(`Fetching real prices from: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching market prices:', error);
            throw error;
        }
    }

    async searchItems(query) {
        if (!query || query.length < 2) return [];
        
        const searchTerm = query.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.id.toLowerCase().includes(searchTerm)
        ).slice(0, 15);
    }

    getRecipe(itemId) {
        return this.recipes.find(recipe => recipe.outputItemId === itemId) || null;
    }

    getAllRecipes() {
        return this.recipes;
    }

    async calculateAllCraftingProfits(options = {}) {
        const { taxRate = 0.03, hasPremium = true, useFocus = false } = options;
        const profitableRecipes = [];

        try {
            // Get prices for all items needed for recipes
            const allItemIds = [...new Set([
                ...this.recipes.map(r => r.outputItemId),
                ...this.recipes.flatMap(r => r.ingredients.map(i => i.itemId))
            ])];

            const allPrices = await this.getMarketPrices(allItemIds);
            const priceMap = this.createPriceMap(allPrices);

            // Calculate profit for each recipe
            for (const recipe of this.recipes) {
                const outputPrice = priceMap[recipe.outputItemId];
                if (!outputPrice) continue;

                const materialPrices = {};
                let missingPrices = false;
                
                for (const ingredient of recipe.ingredients) {
                    const price = priceMap[ingredient.itemId];
                    if (!price || price.sell_price_min === 0) {
                        missingPrices = true;
                        break;
                    }
                    materialPrices[ingredient.itemId] = price;
                }

                if (missingPrices) continue;

                const profitResult = ProfitCalculators.calculateCraftingProfit(
                    recipe, materialPrices, outputPrice, options
                );

                if (profitResult.isValid && profitResult.profit > 0) {
                    profitableRecipes.push({
                        recipe,
                        profit: profitResult,
                        cities: this.findBestCities(priceMap, recipe.outputItemId)
                    });
                }
            }

            return profitableRecipes.sort((a, b) => b.profit.profit - a.profit.profit);
        } catch (error) {
            console.error('Error calculating all crafting profits:', error);
            return [];
        }
    }

    createPriceMap(prices) {
        const map = {};
        prices.forEach(price => {
            if (!map[price.item_id]) map[price.item_id] = price;
            // Keep the price from the city with best liquidity
            if (price.sell_order_count > (map[price.item_id].sell_order_count || 0)) {
                map[price.item_id] = price;
            }
        });
        return map;
    }

    findBestCities(priceMap, itemId) {
        const prices = Object.values(priceMap).filter(p => p.item_id === itemId);
        const bestSell = prices.filter(p => p.buy_price_max > 0)
            .sort((a, b) => b.buy_price_max - a.buy_price_max)[0];
        const bestBuy = prices.filter(p => p.sell_price_min > 0)
            .sort((a, b) => a.sell_price_min - b.sell_price_min)[0];
        
        return {
            bestSellCity: bestSell?.city,
            bestBuyCity: bestBuy?.city
        };
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clearCache() {
        this.cache.clear();
    }
}

window.albionAPI = new AlbionAPI();