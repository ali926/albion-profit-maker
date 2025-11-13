// UI Management and DOM Manipulation
class UIManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.isLoading = false;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Crafting calculator
        document.getElementById('calculateCrafting').addEventListener('click', () => {
            this.calculateCraftingProfits();
        });

        document.getElementById('itemSearch').addEventListener('input', (e) => {
            this.handleItemSearch(e.target.value);
        });

        // Flipping calculator
        document.getElementById('findFlips').addEventListener('click', () => {
            this.findFlipOpportunities();
        });

        // Price checker
        document.getElementById('checkPrices').addEventListener('click', () => {
            this.checkItemPrices();
        });

        document.getElementById('priceSearch').addEventListener('input', (e) => {
            this.handlePriceSearch(e.target.value);
        });

        // Farming calculator
        document.getElementById('calculateGathering').addEventListener('click', () => {
            this.calculateGatheringProfit();
        });

        // Settings
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearData();
        });

        // Global refresh
        document.getElementById('refreshAll').addEventListener('click', () => {
            this.refreshAllData();
        });

        // Enter key support for search inputs
        document.getElementById('itemSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calculateCraftingProfits();
        });

        document.getElementById('priceSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkItemPrices();
        });
    }

    switchTab(tabName) {
        // Update active nav button
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.updateStatus(`Switched to ${this.getTabDisplayName(tabName)}`);

        // Load tab-specific data
        this.loadTabData(tabName);
    }

    getTabDisplayName(tab) {
        const names = {
            'dashboard': 'Dashboard',
            'crafting': 'Crafting Calculator',
            'flipping': 'Market Flipping',
            'prices': 'Price Checker',
            'farming': 'Farming Calculator',
            'settings': 'Settings'
        };
        return names[tab] || tab;
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'crafting':
                // Nothing to preload
                break;
            case 'flipping':
                // Nothing to preload
                break;
            case 'prices':
                // Nothing to preload
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            
            // Load some sample data for dashboard
            const sampleItems = ['T4_METALBAR', 'T5_METALBAR', 'T4_ARMOR_CLOTH_SET2'];
            const prices = await albionAPI.getMarketPrices(sampleItems);
            
            // Update stats
            this.updateDashboardStats(prices);
            this.updateDashboardOpportunities(prices);
            
        } catch (error) {
            this.showError('Failed to load dashboard data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    updateDashboardStats(prices) {
        // Calculate some sample stats
        const topFlip = 1247;
        const topCraft = 892;
        const hotItems = prices.filter(p => p.sell_price_min > 0 && p.buy_price_max > 0).length;

        document.getElementById('topFlipProfit').textContent = topFlip.toLocaleString();
        document.getElementById('topCraftProfit').textContent = topCraft.toLocaleString();
        document.getElementById('hotItems').textContent = hotItems;
        document.getElementById('lastUpdate').textContent = 'Just now';
    }

    updateDashboardOpportunities(prices) {
        // This would populate the dashboard with real opportunities
        const topCraftingHTML = `
            <div class="opportunity-item">
                <div class="opp-header">
                    <span class="opp-name">Steel Bars</span>
                    <span class="opp-profit">+1,247 silver</span>
                </div>
                <div class="opp-details">
                    <span>28.5% margin • Low Risk</span>
                </div>
            </div>
            <div class="opportunity-item">
                <div class="opp-header">
                    <span class="opp-name">Scholar Robes</span>
                    <span class="opp-profit">+892 silver</span>
                </div>
                <div class="opp-details">
                    <span>15.2% margin • Medium Risk</span>
                </div>
            </div>
        `;

        const topFlippingHTML = `
            <div class="opportunity-item">
                <div class="opp-header">
                    <span class="opp-name">Steel Bars</span>
                    <span class="opp-profit">+245 silver</span>
                </div>
                <div class="opp-details">
                    <span>Thetford → Martlock • 12.5% margin</span>
                </div>
            </div>
            <div class="opportunity-item">
                <div class="opp-header">
                    <span class="opp-name">Fine Cloth</span>
                    <span class="opp-profit">+189 silver</span>
                </div>
                <div class="opp-details">
                    <span>Lymhurst → Bridgewatch • 8.7% margin</span>
                </div>
            </div>
        `;

        document.getElementById('topCrafting').innerHTML = topCraftingHTML;
        document.getElementById('topFlipping').innerHTML = topFlippingHTML;
    }

    async handleItemSearch(query) {
        if (query.length < 2) {
            document.getElementById('searchResults').innerHTML = '';
            document.getElementById('searchResults').style.display = 'none';
            return;
        }

        try {
            const results = await albionAPI.searchItems(query);
            this.displaySearchResults(results, 'searchResults');
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    async handlePriceSearch(query) {
        if (query.length < 2) {
            document.getElementById('priceSearchResults').innerHTML = '';
            document.getElementById('priceSearchResults').style.display = 'none';
            return;
        }

        try {
            const results = await albionAPI.searchItems(query);
            this.displaySearchResults(results, 'priceSearchResults');
        } catch (error) {
            console.error('Price search error:', error);
        }
    }

    displaySearchResults(results, containerId) {
        const container = document.getElementById(containerId);
        
        if (results.length === 0) {
            container.innerHTML = '<div class="search-result-item">No items found</div>';
            container.style.display = 'block';
            return;
        }

        container.innerHTML = results.map(item => `
            <div class="search-result-item" data-item-id="${item.id}" data-item-name="${item.name}">
                <strong>${item.name}</strong>
                <small>T${item.tier} ${item.category}</small>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const itemName = e.currentTarget.dataset.itemName;
                
                if (containerId === 'searchResults') {
                    document.getElementById('itemSearch').value = itemName;
                    this.calculateCraftingProfits(itemId);
                } else {
                    document.getElementById('priceSearch').value = itemName;
                    this.checkItemPrices(itemId);
                }
                
                container.style.display = 'none';
            });
        });

        container.style.display = 'block';
    }

    async calculateCraftingProfits(specificItemId = null) {
        this.showLoading(true);
        
        try {
            let itemId = specificItemId;
            if (!itemId) {
                const searchValue = document.getElementById('itemSearch').value.trim();
                if (!searchValue) {
                    this.showError('Please enter an item to search');
                    return;
                }
                // In a real implementation, you'd map the search term to an item ID
                itemId = 'T4_ARMOR_CLOTH_SET2'; // Default for demo
            }

            // Get recipe
            const recipe = await albionAPI.getRecipe(itemId);
            if (!recipe) {
                this.showError('No recipe found for this item');
                return;
            }

            // Get prices for all required items
            const itemIds = [recipe.outputItemId, ...recipe.ingredients.map(i => i.itemId)];
            const prices = await albionAPI.getMarketPrices(itemIds);

            // Organize prices by item ID
            const priceMap = {};
            prices.forEach(price => {
                if (!priceMap[price.item_id]) {
                    priceMap[price.item_id] = price;
                }
            });

            // Get calculation options
            const options = {
                taxRate: parseFloat(document.getElementById('taxRate').value) / 100,
                hasPremium: document.getElementById('premiumBonus').checked,
                useFocus: document.getElementById('useFocus').checked,
                useJournals: document.getElementById('useJournals').checked
            };

            // Calculate profit
            const outputPrice = priceMap[recipe.outputItemId];
            const profitResult = profitCalculators.calculateCraftingProfit(
                recipe, priceMap, outputPrice, options
            );

            // Display results
            this.displayCraftingResults(recipe, profitResult, priceMap);

            this.updateStatus(`Calculated profits for ${recipe.name}`);

        } catch (error) {
            this.showError('Failed to calculate crafting profits: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayCraftingResults(recipe, profitResult, priceMap) {
        const container = document.getElementById('craftingResults');
        
        if (!profitResult.isValid) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Insufficient market data to calculate profits for ${recipe.name}</p>
                </div>
            `;
            return;
        }

        const profitClass = profitResult.risk === 'low' ? 'high' : 
                          profitResult.risk === 'medium' ? 'medium' : 'low';

        const html = `
            <div class="result-item ${profitResult.risk}-risk">
                <div class="result-header">
                    <h4>${recipe.name}</h4>
                    <span class="profit-badge ${profitClass}">
                        ${profitResult.profit.toLocaleString()} silver profit
                    </span>
                </div>
                <div class="result-details">
                    <div class="detail-item">
                        <div class="detail-label">Profit Margin</div>
                        <div class="detail-value">${profitResult.profitPercentage}%</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Material Cost</div>
                        <div class="detail-value">${profitResult.materialCost.toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Sell Price</div>
                        <div class="detail-value">${profitResult.outputValue.toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Risk Level</div>
                        <div class="detail-value">${profitResult.risk.toUpperCase()}</div>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn-secondary save-craft" data-recipe='${JSON.stringify(recipe)}'>
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Add save handler
        container.querySelector('.save-craft').addEventListener('click', (e) => {
            const recipeData = JSON.parse(e.target.dataset.recipe);
            dataManager.saveCraft({
                recipe: recipeData,
                profit: profitResult,
                calculatedAt: new Date().toISOString()
            });
            this.showSuccess('Craft saved to favorites!');
        });
    }

    async findFlipOpportunities() {
        this.showLoading(true);
        
        try {
            // Get popular items for flipping analysis
            const popularItems = [
                'T4_METALBAR', 'T5_METALBAR', 'T4_PLANKS', 'T5_PLANKS',
                'T4_CLOTH', 'T5_CLOTH', 'T4_LEATHER', 'T5_LEATHER'
            ];

            const prices = await albionAPI.getMarketPrices(popularItems);

            // Get filters
            const filters = {
                minProfit: parseInt(document.getElementById('minProfit').value) || 100,
                minMargin: parseInt(document.getElementById('minMargin').value) || 5,
                minLiquidity: 0 // You could add this filter
            };

            // Find opportunities
            const opportunities = profitCalculators.findFlipOpportunities(prices, filters);

            // Display results
            this.displayFlipOpportunities(opportunities);

            this.updateStatus(`Found ${opportunities.length} flip opportunities`);

        } catch (error) {
            this.showError('Failed to find flip opportunities: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayFlipOpportunities(opportunities) {
        const container = document.getElementById('flipsResults');
        const countElement = document.getElementById('flipsCount');

        if (opportunities.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No flip opportunities found with current filters</p>
                    </td>
                </tr>
            `;
            countElement.textContent = '0 opportunities found';
            return;
        }

        countElement.textContent = `${opportunities.length} opportunities found`;

        container.innerHTML = opportunities.map(opp => `
            <tr>
                <td><strong>${opp.itemName}</strong></td>
                <td>${opp.buyCity}</td>
                <td>${opp.sellCity}</td>
                <td style="color: #27ae60; font-weight: bold;">${opp.profit.toLocaleString()}</td>
                <td>${opp.margin}%</td>
                <td>
                    <span class="liquidity-${opp.liquidityScore > 0.5 ? 'high' : opp.liquidityScore > 0.2 ? 'medium' : 'low'}">
                        ${opp.liquidityScore.toFixed(1)}
                    </span>
                </td>
                <td>
                    <span class="risk-${opp.risk}">${opp.risk.toUpperCase()}</span>
                </td>
                <td>
                    <button class="btn-secondary save-flip" data-opp='${JSON.stringify(opp)}'>
                        <i class="fas fa-save"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add save handlers
        container.querySelectorAll('.save-flip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oppData = JSON.parse(e.target.dataset.opp);
                dataManager.saveFlip(oppData);
                this.showSuccess('Flip opportunity saved!');
            });
        });
    }

    async checkItemPrices(specificItemId = null) {
        this.showLoading(true);
        
        try {
            let itemId = specificItemId;
            if (!itemId) {
                const searchValue = document.getElementById('priceSearch').value.trim();
                if (!searchValue) {
                    this.showError('Please enter an item to search');
                    return;
                }
                // In a real implementation, you'd map the search term to an item ID
                itemId = 'T4_METALBAR'; // Default for demo
            }

            const prices = await albionAPI.getMarketPrices(itemId);
            this.displayPriceComparison(prices);

            this.updateStatus(`Price check completed for ${itemId}`);

        } catch (error) {
            this.showError('Failed to check prices: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayPriceComparison(prices) {
        const container = document.getElementById('priceComparison');
        
        if (!prices || prices.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No price data available for this item</p>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>City</th>
                            <th>Sell Price</th>
                            <th>Buy Price</th>
                            <th>Orders</th>
                            <th>Supply</th>
                            <th>Demand</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prices.map(price => `
                            <tr>
                                <td><strong>${price.city}</strong></td>
                                <td>${price.sell_price_min ? price.sell_price_min.toLocaleString() : 'N/A'}</td>
                                <td>${price.buy_price_max ? price.buy_price_max.toLocaleString() : 'N/A'}</td>
                                <td>${price.sell_order_count || 0}/${price.buy_order_count || 0}</td>
                                <td>
                                    <span class="supply-${this.getSupplyLevel(price.sell_order_count)}">
                                        ${this.getSupplyLevel(price.sell_order_count).toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <span class="demand-${this.getDemandLevel(price.buy_order_count)}">
                                        ${this.getDemandLevel(price.buy_order_count).toUpperCase()}
                                    </span>
                                </td>
                                <td>${this.getBestAction(price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    getSupplyLevel(orderCount) {
        if (!orderCount) return 'none';
        if (orderCount > 100) return 'high';
        if (orderCount > 20) return 'medium';
        return 'low';
    }

    getDemandLevel(orderCount) {
        if (!orderCount) return 'none';
        if (orderCount > 100) return 'high';
        if (orderCount > 20) return 'medium';
        return 'low';
    }

    getBestAction(price) {
        if (!price.sell_price_min || !price.buy_price_max) return 'Monitor';
        if (price.sell_order_count > price.buy_order_count * 2) return 'Buy';
        if (price.buy_order_count > price.sell_order_count * 2) return 'Sell';
        return 'Hold';
    }

    async calculateGatheringProfit() {
        this.showLoading(true);
        
        try {
            const resourceType = document.getElementById('resourceType').value;
            const tier = parseInt(document.getElementById('tierLevel').value);

            const result = profitCalculators.calculateGatheringProfit(resourceType, tier);

            this.showGatheringResult(result, resourceType, tier);

            this.updateStatus(`Calculated ${resourceType} gathering profits for T${tier}`);

        } catch (error) {
            this.showError('Failed to calculate gathering profits: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showGatheringResult(result, resourceType, tier) {
        // This would display the gathering calculation results
        alert(`T${tier} ${resourceType} Gathering:\n` +
              `Estimated: ${result.silverPerHour.toLocaleString()} silver/hour\n` +
              `Risk: ${result.risk}\n` +
              `Zones: ${result.optimalZones.join(', ')}`);
    }

    loadSettings() {
        const settings = dataManager.data.settings;
        document.getElementById('defaultTax').value = settings.taxRate;
        document.getElementById('autoPremium').checked = settings.assumePremium;
        document.getElementById('updateInterval').value = settings.updateInterval;
    }

    exportData() {
        const downloadUrl = dataManager.exportData();
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'albion-profit-maker-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        this.showSuccess('Data exported successfully!');
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            dataManager.clearData();
            this.showSuccess('All data cleared successfully!');
        }
    }

    async refreshAllData() {
        this.showLoading(true);
        try {
            albionAPI.clearCache();
            await this.loadDashboardData();
            this.updateStatus('All data refreshed successfully!');
        } catch (error) {
            this.showError('Failed to refresh data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // Utility methods
    showLoading(show) {
        const indicator = document.getElementById('loadingIndicator');
        indicator.style.display = show ? 'flex' : 'none';
        this.isLoading = show;
    }

    updateStatus(message, isError = false) {
        const statusElement = document.getElementById('statusMessage');
        const icon = isError ? 'exclamation-triangle' : 'info-circle';
        statusElement.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
        statusElement.style.color = isError ? '#e74c3c' : '#2c3e50';
    }

    showError(message) {
        this.updateStatus(message, true);
        console.error(message);
    }

    showSuccess(message) {
        this.updateStatus(message, false);
        // You could add a toast notification here
    }
}

// Create global UI instance
window.uiManager = new UIManager();