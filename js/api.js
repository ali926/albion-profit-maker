// Albion Online Data API Service
class AlbionAPI {
    constructor() {
        this.baseURL = 'https://west.albion-online-data.com/api/v2/stats';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async getMarketPrices(itemIds, locations = ['Thetford', 'Fort Sterling', 'Lymhurst', 'Bridgewatch', 'Martlock', 'Black Market']) {
        try {
            const cacheKey = `prices_${itemIds.join('_')}_${locations.join('_')}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const locationParam = locations.join(',');
            const itemParam = Array.isArray(itemIds) ? itemIds.join(',') : itemIds;
            
            const url = `${this.baseURL}/prices/${itemParam}?locations=${locationParam}`;
            
            console.log(`Fetching prices from: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching market prices:', error);
            throw error;
        }
    }

    async searchItems(query) {
        try {
            // Since the official API doesn't have search, we'll use a local item database
            const items = await this.getItemDatabase();
            const searchTerm = query.toLowerCase();
            
            return items.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm)
            ).slice(0, 20); // Limit results
        } catch (error) {
            console.error('Error searching items:', error);
            return [];
        }
    }

    async getItemDatabase() {
        // This would be a comprehensive list of Albion items
        // For now, we'll return a sample set and expand as needed
        return [
            { id: 'T4_ORE', name: 'Iron Ore', category: 'ORE', tier: 4 },
            { id: 'T5_ORE', name: 'Steel Ore', category: 'ORE', tier: 5 },
            { id: 'T6_ORE', name: 'Titanium Ore', category: 'ORE', tier: 6 },
            { id: 'T4_METALBAR', name: 'Iron Bar', category: 'METALBAR', tier: 4 },
            { id: 'T5_METALBAR', name: 'Steel Bar', category: 'METALBAR', tier: 5 },
            { id: 'T6_METALBAR', name: 'Titanium Steel Bar', category: 'METALBAR', tier: 6 },
            { id: 'T4_WOOD', name: 'Birch Logs', category: 'WOOD', tier: 4 },
            { id: 'T5_WOOD', name: 'Chestnut Logs', category: 'WOOD', tier: 5 },
            { id: 'T6_WOOD', name: 'Pine Logs', category: 'WOOD', tier: 6 },
            { id: 'T4_PLANKS', name: 'Birch Planks', category: 'PLANKS', tier: 4 },
            { id: 'T5_PLANKS', name: 'Chestnut Planks', category: 'PLANKS', tier: 5 },
            { id: 'T4_CLOTH', name: 'Cotton', category: 'CLOTH', tier: 4 },
            { id: 'T5_CLOTH', name: 'Fine Cloth', category: 'CLOTH', tier: 5 },
            { id: 'T4_LEATHER', name: 'Medium Leather', category: 'LEATHER', tier: 4 },
            { id: 'T5_LEATHER', name: 'Hard Leather', category: 'LEATHER', tier: 5 },
            { id: 'T4_HEAD_CLOTH_SET2', name: 'Scholar Cowl', category: 'HEAD_CLOTH', tier: 4 },
            { id: 'T5_HEAD_CLOTH_SET2', name: 'Scholar Cowl', category: 'HEAD_CLOTH', tier: 5 },
            { id: 'T4_ARMOR_CLOTH_SET2', name: 'Scholar Robe', category: 'ARMOR_CLOTH', tier: 4 },
            { id: 'T5_ARMOR_CLOTH_SET2', name: 'Scholar Robe', category: 'ARMOR_CLOTH', tier: 5 },
            { id: 'T4_SHOES_CLOTH_SET2', name: 'Scholar Sandals', category: 'SHOES_CLOTH', tier: 4 },
            { id: 'T5_SHOES_CLOTH_SET2', name: 'Scholar Sandals', category: 'SHOES_CLOTH', tier: 5 }
        ];
    }

    async getRecipe(itemId) {
        // In a real implementation, you'd have a comprehensive recipe database
        // For now, we'll return some sample recipes
        const recipes = {
            'T4_METALBAR': {
                id: 'recipe_t4_metalbar',
                name: 'Iron Bar',
                outputItemId: 'T4_METALBAR',
                outputQuantity: 1,
                ingredients: [
                    { itemId: 'T4_ORE', quantity: 2 }
                ]
            },
            'T5_METALBAR': {
                id: 'recipe_t5_metalbar',
                name: 'Steel Bar',
                outputItemId: 'T5_METALBAR',
                outputQuantity: 1,
                ingredients: [
                    { itemId: 'T5_ORE', quantity: 2 }
                ]
            },
            'T4_ARMOR_CLOTH_SET2': {
                id: 'recipe_t4_scholar_robe',
                name: 'Scholar Robe',
                outputItemId: 'T4_ARMOR_CLOTH_SET2',
                outputQuantity: 1,
                ingredients: [
                    { itemId: 'T4_CLOTH', quantity: 20 },
                    { itemId: 'T4_LEATHER', quantity: 8 }
                ]
            }
        };

        return recipes[itemId] || null;
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
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // Get current server status
    async getServerStatus() {
        try {
            const response = await fetch('https://serverstatus.albiononline.com/');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching server status:', error);
            return null;
        }
    }
}

// Create global API instance
window.albionAPI = new AlbionAPI();