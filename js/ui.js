// Real UI Manager with Actual Functionality
class UIManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.isLoading = false;
        this.searchTimeout = null;
        this.initializeEventListeners();
        this.loadUserPreferences();
    }

    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Real crafting calculator
        document.getElementById('calculateCrafting').addEventListener('click', () => {
            this.calculateRealCraftingProfits();
        });

        document.getElementById('itemSearch').addEventListener('input', (e) => {
            this.handleRealItemSearch(e.target.value);
        });

        // Real flipping calculator
        document.getElementById('findFlips').addEventListener('click', () => {
            this.findRealFlipOpportunities();
        });

        // Real price checker
        document.getElementById('checkPrices').addEventListener('click', () => {
            this.checkRealItemPrices();
        });

        document.getElementById('priceSearch').addEventListener('input', (e) => {
            this.handleRealPriceSearch(e.target.value);
        });

        // Real farming calculator
        document.getElementById('calculateGathering').addEventListener('click', () => {
            this.calculateRealGatheringProfit();
        });

        // Settings
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportRealData();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearRealData();
        });

        document.getElementById('refreshAll').addEventListener('click', () => {
            this.refreshRealData();
        });

        // Real-time search with debouncing
        document.getElementById('itemSearch').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.handleRealItemSearch(e.target.value);
            }, 300);
        });

        document.getElementById('priceSearch').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.handleRealPriceSearch(e.target.value);
            }, 300);
        });

        // Enter key support
        document.getElementById('itemSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.calculateRealCraftingProfits();
        });

        document.getElementById('priceSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkRealItemPrices();
        });
    }

    async switchTab(tabName) {
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;
        this.updateStatus(`Loaded ${this.getTabDisplayName(tabName)}`);

        await this.loadRealTabData(tabName);
    }

    async loadRealTabData(tabName) {
        switch (tabName) {
            case 'dashboard':
                await this.loadRealDashboard();
                break;
            case 'crafting':
                await this.preloadCraftingData();
                break;
            case 'flipping':
                await this.preloadFlippingData();
                break;
            case 'prices':
                // Price data loaded on demand
                break;
            case 'settings':
                this.loadRealSettings();
                break;
        }
    }

    async loadRealDashboard() {
        this.showLoading(true);
        try {
            // Load real market data for dashboard
            const popularItems = ['T4_METALBAR', 'T5_METALBAR', 'T4_PLANKS', 'T5_PLANKS'];
            const prices = await albionAPI.getMarketPrices(popularItems);
            
            // Calculate real stats
            const flips = await profitCalculators.findRealFlipOpportunities({ minProfit: 50 });
            const craftingProfits = await albionAPI.calculateAllCraftingProfits();
            
            this.updateRealDashboardStats(flips, craftingProfits, prices);
            this.updateRealDashboardOpportunities(flips, craftingProfits);
            
        } catch (error) {
            this.showError('Failed to load dashboard data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    updateRealDashboardStats(flips, crafts, prices) {
        const topFlip = flips.length > 0 ? Math.max(...flips.map(f => f.profit)) : 0;
        const topCraft = crafts.length > 0 ? Math.max(...crafts.map(c => c.profit.profit)) : 0;
        const activeItems = prices.filter(p => p.sell_price_min > 0 && p.buy_price_max > 0).length;

        document.getElementById('topFlipProfit').textContent = topFlip.toLocaleString();
        document.getElementById('topCraftProfit').textContent = topCraft.toLocaleString();
        document.getElementById('hotItems').textContent = activeItems;
        document.getElementById('lastUpdate').textContent = 'Live';
    }

    updateRealDashboardOpportunities(flips, crafts) {
        const topCraftingHTML = crafts.slice(0, 3).map(craft => `
            <div class="opportunity-item">
                <div class="opp-header">
                    <span class="opp-name">${craft.recipe.name}</span>
                    <span class="opp-profit" style="color: #27ae60;">+${craft.profit.profit.toLocaleString()} silver</span>
                </div>
                <div class="opp-details">
                    <span>${craft.profit.profitPercentage}% margin • ${craft.profit.risk.toUpperCase()} Risk</span>
                </div>
            </div>
        `).join('');

        const topFlippingHTML = flips.slice(0, 3).map(flip => `
            <div class="opportunity-item">
                <div class="opp-header">
                    <span class="opp-name">${flip.itemName}</span>
                    <span class="opp-profit" style="color: #27ae60;">+${flip.profit.toLocaleString()} silver</span>
                </div>
                <div class="opp-details">
                    <span>${flip.buyCity} → ${flip.sellCity} • ${flip.margin}% margin</span>
                </div>
            </div>
        `).join('');

        document.getElementById('topCrafting').innerHTML = topCraftingHTML || '<div class="no-data">No profitable crafts found</div>';
        document.getElementById('topFlipping').innerHTML = topFlippingHTML || '<div class="no-data">No flip opportunities found</div>';
    }

    async handleRealItemSearch(query) {
        if (!query || query.length < 2) {
            this.hideSearchResults('searchResults');
            return;
        }

        try {
            const results = await albionAPI.searchItems(query);
            this.displayRealSearchResults(results, 'searchResults');
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    async handleRealPriceSearch(query) {
        if (!query || query.length < 2) {
            this.hideSearchResults('priceSearchResults');
            return;
        }

        try {
            const results = await albionAPI.searchItems(query);
            this.displayRealSearchResults(results, 'priceSearchResults');
        } catch (error) {
            console.error('Price search error:', error);
        }
    }

    displayRealSearchResults(results, containerId) {
        const container = document.getElementById(containerId);
        
        if (!results || results.length === 0) {
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

        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const itemName = e.currentTarget.dataset.itemName;
                
                if (containerId === 'searchResults') {
                    document.getElementById('itemSearch').value = itemName;
                    this.calculateRealCraftingProfits(itemId);
                } else {
                    document.getElementById('priceSearch').value = itemName;
                    this.checkRealItemPrices(itemId);
                }
                
                container.style.display = 'none';
            });
        });

        container.style.display = 'block';
    }

    hideSearchResults(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        container.style.display = 'none';
    }

    async calculateRealCraftingProfits(specificItemId = null) {
        this.showLoading(true);
        
        try {
            let itemId = specificItemId;
            if (!itemId) {
                const searchValue = document.getElementById('itemSearch').value.trim();
                if (!searchValue) {
                    // Calculate profits for all recipes
                    await this.calculateAllRealCraftingProfits();
                    return;
                }
                // Find item ID from search
                const results = await albionAPI.searchItems(searchValue);
                if (results.length === 0) {
                    this.showError('Item not found: ' + searchValue);
                    return;
                }
                itemId = results[0].id;
            }

            const recipe = albionAPI.getRecipe(itemId);
            if (!recipe) {
                this.showError('No recipe found for this item');
                return;
            }

            const itemIds = [recipe.outputItemId, ...recipe.ingredients.map(i => i.itemId)];
            const prices = await albionAPI.getMarketPrices(itemIds);

            const priceMap = {};
            prices.forEach(price => {
                if (!priceMap[price.item_id]) priceMap[price.item_id] = price;
            });

            const options = {
                taxRate: parseFloat(document.getElementById('taxRate').value) / 100,
                hasPremium: document.getElementById('premiumBonus').checked,
                useFocus: document.getElementById('useFocus').checked,
                useJournals: document.getElementById('useJournals').checked
            };

            const outputPrice = priceMap[recipe.outputItemId];
            const profitResult = profitCalculators.calculateCraftingProfit(
                recipe, priceMap, outputPrice, options
            );

            this.displayRealCraftingResults(recipe, profitResult, priceMap);
            this.updateStatus(`Calculated real profits for ${recipe.name}`);

        } catch (error) {
            this.showError('Failed to calculate crafting profits: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async calculateAllRealCraftingProfits() {
        this.showLoading(true);
        try {
            const options = {
                taxRate: parseFloat(document.getElementById('taxRate').value) / 100,
                hasPremium: document.getElementById('premiumBonus').checked,
                useFocus: document.getElementById('useFocus').checked
            };

            const profitableRecipes = await albionAPI.calculateAllCraftingProfits(options);
            this.displayAllRealCraftingResults(profitableRecipes);
            
            this.updateStatus(`Found ${profitableRecipes.length} profitable crafting opportunities`);
        } catch (error) {
            this.showError('Failed to calculate all crafting profits: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayRealCraftingResults(recipe, profitResult, priceMap) {
        const container = document.getElementById('craftingResults');
        
        if (!profitResult.isValid) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Insufficient market data for ${recipe.name}</p>
                    <small>Try checking during peak hours</small>
                </div>
            `;
            return;
        }

        const riskColor = profitResult.risk === 'low' ? '#27ae60' : profitResult.risk === 'medium' ? '#f39c12' : '#e74c3c';
        
        const html = `
            <div class="result-item" style="border-left-color: ${riskColor}">
                <div class="result-header">
                    <h4>${recipe.name} (T${albionAPI.items.find(i => i.id === recipe.outputItemId)?.tier || 4})</h4>
                    <span class="profit-badge" style="background: ${riskColor === '#27ae60' ? '#d4edda' : riskColor === '#f39c12' ? '#fff3cd' : '#f8d7da'}; color: ${riskColor === '#27ae60' ? '#155724' : riskColor === '#f39c12' ? '#856404' : '#721c24'}">
                        ${profitResult.profit.toLocaleString()} silver
                    </span>
                </div>
                <div class="result-details">
                    <div class="detail-item">
                        <div class="detail-label">PROFIT MARGIN</div>
                        <div class="detail-value" style="color: ${profitResult.profitPercentage > 0 ? '#27ae60' : '#e74c3c'}">
                            ${profitResult.profitPercentage}%
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">MATERIAL COST</div>
                        <div class="detail-value">${profitResult.materialCost.toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">SELL VALUE</div>
                        <div class="detail-value">${profitResult.outputValue.toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">MARKET LIQUIDITY</div>
                        <div class="detail-value">${profitResult.sellOrders} sell / ${profitResult.buyOrders} buy</div>
                    </div>
                </div>
                <div class="result-actions">
                    <button class="btn-primary save-craft" data-recipe='${JSON.stringify(recipe).replace(/'/g, "\\'")}' data-profit='${JSON.stringify(profitResult).replace(/'/g, "\\'")}'>
                        <i class="fas fa-save"></i> Save Opportunity
                    </button>
                    <button class="btn-secondary" onclick="uiManager.checkRealItemPrices('${recipe.outputItemId}')">
                        <i class="fas fa-chart-line"></i> Check Prices
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;

        container.querySelector('.save-craft').addEventListener('click', (e) => {
            const recipeData = JSON.parse(e.target.dataset.recipe);
            const profitData = JSON.parse(e.target.dataset.profit);
            dataManager.saveCraftingOpportunity({
                recipe: recipeData,
                profit: profitData,
                calculatedAt: new Date().toISOString()
            });
            this.showSuccess('Crafting opportunity saved!');
        });
    }

    displayAllRealCraftingResults(profitableRecipes) {
        const container = document.getElementById('craftingResults');
        
        if (profitableRecipes.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-search"></i>
                    <p>No profitable crafting opportunities found</p>
                    <small>Try adjusting your filters or check during peak market hours</small>
                </div>
            `;
            return;
        }

        const html = profitableRecipes.map(item => {
            const recipe = item.recipe;
            const profit = item.profit;
            const riskColor = profit.risk === 'low' ? '#27ae60' : profit.risk === 'medium' ? '#f39c12' : '#e74c3c';
            
            return `
                <div class="result-item" style="border-left-color: ${riskColor}">
                    <div class="result-header">
                        <h4>${recipe.name} (T${albionAPI.items.find(i => i.id === recipe.outputItemId)?.tier || 4})</h4>
                        <span class="profit-badge" style="background: ${riskColor === '#27ae60' ? '#d4edda' : riskColor === '#f39c12' ? '#fff3cd' : '#f8d7da'}; color: ${riskColor === '#27ae60' ? '#155724' : riskColor === '#f39c12' ? '#856404' : '#721c24'}">
                            ${profit.profit.toLocaleString()} silver
                        </span>
                    </div>
                    <div class="result-details">
                        <div class="detail-item">
                            <div class="detail-label">PROFIT MARGIN</div>
                            <div class="detail-value" style="color: ${profit.profitPercentage > 0 ? '#27ae60' : '#e74c3c'}">
                                ${profit.profitPercentage}%
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">MATERIAL COST</div>
                            <div class="detail-value">${profit.materialCost.toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">MARKET ORDERS</div>
                            <div class="detail-value">${profit.sellOrders} sell / ${profit.buyOrders} buy</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">RISK LEVEL</div>
                            <div class="detail-value" style="color: ${riskColor}">${profit.risk.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    async findRealFlipOpportunities() {
        this.showLoading(true);
        
        try {
            const filters = {
                minProfit: parseInt(document.getElementById('minProfit').value) || 100,
                minMargin: parseInt(document.getElementById('minMargin').value) || 5,
                minLiquidity: 0.1
            };

            const opportunities = await profitCalculators.findRealFlipOpportunities(filters);
            this.displayRealFlipOpportunities(opportunities);
            
            this.updateStatus(`Found ${opportunities.length} real flip opportunities`);

        } catch (error) {
            this.showError('Failed to find flip opportunities: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayRealFlipOpportunities(opportunities) {
        const container = document.getElementById('flipsResults');
        const countElement = document.getElementById('flipsCount');

        if (opportunities.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <i class="fas fa-search"></i>
                        <p>No flip opportunities found with current filters</p>
                        <small>Try adjusting minimum profit or margin requirements</small>
                    </td>
                </tr>
            `;
            countElement.textContent = '0 opportunities found';
            return;
        }

        countElement.textContent = `${opportunities.length} real opportunities found`;

        container.innerHTML = opportunities.map(opp => {
            const riskColor = opp.risk === 'low' ? '#27ae60' : opp.risk === 'medium' ? '#f39c12' : '#e74c3c';
            const liquidityColor = opp.liquidityScore > 0.5 ? '#27ae60' : opp.liquidityScore > 0.2 ? '#f39c12' : '#e74c3c';
            
            return `
                <tr>
                    <td><strong>${opp.itemName}</strong><br><small>T${albionAPI.items.find(i => i.id === opp.itemId)?.tier || 4}</small></td>
                    <td>${opp.buyCity}</td>
                    <td>${opp.sellCity}</td>
                    <td style="color: #27ae60; font-weight: bold;">${opp.profit.toLocaleString()}</td>
                    <td>${opp.margin}%</td>
                    <td><span style="color: ${liquidityColor}; font-weight: bold;">${opp.liquidityScore.toFixed(1)}</span></td>
                    <td><span style="color: ${riskColor}; font-weight: bold;">${opp.risk.toUpperCase()}</span></td>
                    <td>
                        <button class="btn-secondary save-flip" data-opp='${JSON.stringify(opp).replace(/'/g, "\\'")}'>
                            <i class="fas fa-save"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        container.querySelectorAll('.save-flip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oppData = JSON.parse(e.target.dataset.opp);
                dataManager.saveFlipOpportunity(oppData);
                this.showSuccess('Flip opportunity saved!');
            });
        });
    }

    async checkRealItemPrices(specificItemId = null) {
        this.showLoading(true);
        
        try {
            let itemId = specificItemId;
            if (!itemId) {
                const searchValue = document.getElementById('priceSearch').value.trim();
                if (!searchValue) {
                    this.showError('Please enter an item name');
                    return;
                }
                const results = await albionAPI.searchItems(searchValue);
                if (results.length === 0) {
                    this.showError('Item not found: ' + searchValue);
                    return;
                }
                itemId = results[0].id;
            }

            const prices = await albionAPI.getMarketPrices(itemId);
            this.displayRealPriceComparison(prices, itemId);

            this.updateStatus(`Real price check completed`);

        } catch (error) {
            this.showError('Failed to check prices: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayRealPriceComparison(prices, itemId) {
        const container = document.getElementById('priceComparison');
        const item = albionAPI.items.find(i => i.id === itemId) || { name: itemId, tier: 4 };
        
        if (!prices || prices.length === 0) {
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>No price data available for ${item.name}</p>
                    <small>This item may not be actively traded</small>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-container">
                <div class="price-header">
                    <h4>${item.name} (T${item.tier}) - Real Market Prices</h4>
                    <small>Updated: ${new Date().toLocaleTimeString()}</small>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>City</th>
                            <th>Best Sell Price</th>
                            <th>Best Buy Price</th>
                            <th>Orders</th>
                            <th>Supply</th>
                            <th>Demand</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prices.map(price => {
                            const supplyLevel = this.getSupplyLevel(price.sell_order_count);
                            const demandLevel = this.getDemandLevel(price.buy_order_count);
                            const bestAction = this.getBestRealAction(price);
                            
                            return `
                                <tr>
                                    <td><strong>${price.city}</strong></td>
                                    <td>${price.sell_price_min ? price.sell_price_min.toLocaleString() + ' silver' : 'N/A'}</td>
                                    <td>${price.buy_price_max ? price.buy_price_max.toLocaleString() + ' silver' : 'N/A'}</td>
                                    <td>${price.sell_order_count || 0} / ${price.buy_order_count || 0}</td>
                                    <td><span class="supply-${supplyLevel}">${supplyLevel.toUpperCase()}</span></td>
                                    <td><span class="demand-${demandLevel}">${demandLevel.toUpperCase()}</span></td>
                                    <td><span class="action-${bestAction.toLowerCase()}">${bestAction}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
    }

    getSupplyLevel(orderCount) {
        if (!orderCount || orderCount === 0) return 'none';
        if (orderCount > 100) return 'high';
        if (orderCount > 20) return 'medium';
        return 'low';
    }

    getDemandLevel(orderCount) {
        if (!orderCount || orderCount === 0) return 'none';
        if (orderCount > 100) return 'high';
        if (orderCount > 20) return 'medium';
        return 'low';
    }

    getBestRealAction(price) {
        if (!price.sell_price_min || !price.buy_price_max) return 'MONITOR';
        
        const spread = price.buy_price_max - price.sell_price_min;
        const spreadPercentage = (spread / price.sell_price_min) * 100;
        
        if (spreadPercentage > 20 && price.sell_order_count > price.buy_order_count) return 'BUY';
        if (spreadPercentage > 10 && price.buy_order_count > price.sell_order_count * 2) return 'SELL';
        return 'HOLD';
    }

    async calculateRealGatheringProfit() {
        this.showLoading(true);
        
        try {
            const resourceType = document.getElementById('resourceType').value;
            const tier = parseInt(document.getElementById('tierLevel').value);
            const hasPremium = document.getElementById('premiumBonus').checked;

            const efficiency = profitCalculators.calculateGatheringEfficiency(resourceType, tier, tier, hasPremium);
            
            // Get current resource prices
            const resourceId = `T${tier}_${resourceType.toUpperCase()}`;
            const prices = await albionAPI.getMarketPrices(resourceId);
            const avgPrice = prices.reduce((sum, p) => sum + (p.sell_price_min || 0), 0) / prices.length || 100;
            
            const silverPerHour = efficiency.yieldPerHour * avgPrice;
            
            this.displayRealGatheringResult(efficiency, silverPerHour, resourceType, tier);

        } catch (error) {
            this.showError('Failed to calculate gathering profit: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displayRealGatheringResult(efficiency, silverPerHour, resourceType, tier) {
        alert(`Real Gathering Analysis - T${tier} ${resourceType}:
        
Estimated Yield: ${efficiency.yieldPerHour.toLocaleString()} units/hour
Silver/Hour: ${silverPerHour.toLocaleString()} silver
Optimal Tier: T${efficiency.optimalTier}
Recommended Gear: ${efficiency.recommendedGear.join(', ')}

Based on current market prices and Albion gathering mechanics.`);
    }

    loadRealSettings() {
        const settings = dataManager.data.settings;
        document.getElementById('defaultTax').value = settings.taxRate;
        document.getElementById('autoPremium').checked = settings.assumePremium;
        document.getElementById('updateInterval').value = settings.updateInterval;
        
        // Display real stats
        const stats = dataManager.getStats();
        document.getElementById('userStats').innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-coins"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.totalProfit.toLocaleString()}</h3>
                    <p>Total Tracked Profit</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <div class="stat-info">
                    <h3>${stats.tradesCompleted}</h3>
                    <p>Trades Completed</p>
                </div>
            </div>
        `;
    }

    exportRealData() {
        const downloadUrl = dataManager.exportData();
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `albion-profit-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        
        this.showSuccess('Real data exported successfully!');
    }

    clearRealData() {
        if (confirm('Are you sure you want to clear ALL real data? This includes your saved opportunities, stats, and settings.')) {
            dataManager.clearData();
            this.showSuccess('All real data cleared successfully!');
            this.loadRealSettings();
        }
    }

    async refreshRealData() {
        this.showLoading(true);
        try {
            albionAPI.clearCache();
            await this.loadRealDashboard();
            this.updateStatus('All real data refreshed from API');
        } catch (error) {
            this.showError('Failed to refresh real data: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    loadUserPreferences() {
        // Load user preferences from data manager
        const settings = dataManager.data.settings;
        if (settings.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
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
        const color = isError ? '#e74c3c' : '#2c3e50';
        
        statusElement.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
        statusElement.style.color = color;
    }

    showError(message) {
        this.updateStatus(message, true);
        console.error('App Error:', message);
    }

    showSuccess(message) {
        this.updateStatus(message, false);
        // Optional: Add toast notification
        if (dataManager.data.settings.notifications) {
            this.showToast(message, 'success');
        }
    }

    showToast(message, type = 'info') {
        // Simple toast notification implementation
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}"></i>
            <span>${message}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getTabDisplayName(tab) {
        const names = {
            'dashboard': 'Real-Time Dashboard',
            'crafting': 'Real Crafting Calculator', 
            'flipping': 'Real Market Flipping',
            'prices': 'Real Price Checker',
            'farming': 'Real Farming Calculator',
            'settings': 'Real Settings'
        };
        return names[tab] || tab;
    }
}

// Initialize global UI instance
window.uiManager = new UIManager();