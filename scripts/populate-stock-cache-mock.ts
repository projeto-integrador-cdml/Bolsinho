/**
 * Script para popular o cache de ações com dados MOCK (exemplo)
 * Use este script se a API do Yahoo Finance não estiver funcionando
 * Execute: pnpm tsx scripts/populate-stock-cache-mock.ts
 */

import "dotenv/config";
import * as db from "../server/db";

// Dados mockados baseados em valores aproximados reais
const MOCK_STOCK_DATA = {
  "PETR4": {
    name: "Petrobras PN",
    currentPrice: 38.50,
    previousClose: 38.20,
    change: 0.30,
    changePercent: 0.78,
    dayHigh: 38.80,
    dayLow: 38.10,
    volume: 45000000,
    currency: "BRL",
    market: "B3",
    sector: "Energia",
    industry: "Petróleo e Gás",
    marketCap: 500000000000,
    history: generateMockHistory(38.50, 30),
  },
  "VALE3": {
    name: "Vale S.A.",
    currentPrice: 68.90,
    previousClose: 68.50,
    change: 0.40,
    changePercent: 0.58,
    dayHigh: 69.20,
    dayLow: 68.30,
    volume: 35000000,
    currency: "BRL",
    market: "B3",
    sector: "Mineração",
    industry: "Mineração de Ferro",
    marketCap: 350000000000,
    history: generateMockHistory(68.90, 30),
  },
  "ITUB4": {
    name: "Itaú Unibanco PN",
    currentPrice: 32.15,
    previousClose: 32.00,
    change: 0.15,
    changePercent: 0.47,
    dayHigh: 32.30,
    dayLow: 31.95,
    volume: 28000000,
    currency: "BRL",
    market: "B3",
    sector: "Financeiro",
    industry: "Bancos",
    marketCap: 300000000000,
    history: generateMockHistory(32.15, 30),
  },
  "BBDC4": {
    name: "Bradesco PN",
    currentPrice: 15.80,
    previousClose: 15.70,
    change: 0.10,
    changePercent: 0.64,
    dayHigh: 15.90,
    dayLow: 15.65,
    volume: 22000000,
    currency: "BRL",
    market: "B3",
    sector: "Financeiro",
    industry: "Bancos",
    marketCap: 150000000000,
    history: generateMockHistory(15.80, 30),
  },
  "ABEV3": {
    name: "Ambev S.A.",
    currentPrice: 12.45,
    previousClose: 12.40,
    change: 0.05,
    changePercent: 0.40,
    dayHigh: 12.50,
    dayLow: 12.35,
    volume: 18000000,
    currency: "BRL",
    market: "B3",
    sector: "Consumo",
    industry: "Bebidas",
    marketCap: 200000000000,
    history: generateMockHistory(12.45, 30),
  },
  "WEGE3": {
    name: "WEG S.A.",
    currentPrice: 42.30,
    previousClose: 42.10,
    change: 0.20,
    changePercent: 0.48,
    dayHigh: 42.50,
    dayLow: 42.00,
    volume: 8000000,
    currency: "BRL",
    market: "B3",
    sector: "Industrial",
    industry: "Equipamentos Elétricos",
    marketCap: 90000000000,
    history: generateMockHistory(42.30, 30),
  },
};

function generateMockHistory(basePrice: number, days: number) {
  const history = [];
  const today = new Date();
  
  // Gera uma tendência leve
  const trend = (Math.random() - 0.5) * 0.001; // Tendência leve
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Gera preços com pequena variação e tendência
    const daysAgo = days - i;
    const variation = (Math.random() - 0.5) * 0.015; // Variação de até 0.75%
    const price = basePrice * (1 + trend * daysAgo + variation);
    
    history.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(price * 0.998 * 100) / 100,
      high: Math.round(price * 1.008 * 100) / 100,
      low: Math.round(price * 0.992 * 100) / 100,
      close: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 10000000) + 5000000,
      adj_close: Math.round(price * 100) / 100,
    });
  }
  
  return history;
}

function createMockHistoryResponse(ticker: string, data: any) {
  const history = data.history || [];
  const firstClose = history.length > 0 ? history[0].close : data.currentPrice;
  const lastClose = data.currentPrice;
  const periodChange = lastClose - firstClose;
  const periodChangePercent = (periodChange / firstClose) * 100;
  
  return {
    success: true,
    ticker: ticker,
    normalized_ticker: `${ticker}.SA`,
    period: "1mo",
    interval: "1d",
    data_points: history.length,
    first_date: history[0]?.date || new Date().toISOString().split('T')[0],
    last_date: history[history.length - 1]?.date || new Date().toISOString().split('T')[0],
    first_close: firstClose,
    last_close: lastClose,
    period_change: Math.round(periodChange * 100) / 100,
    period_change_percent: Math.round(periodChangePercent * 100) / 100,
    high_price: Math.max(...history.map((h: any) => h.high)),
    low_price: Math.min(...history.map((h: any) => h.low)),
    avg_price: history.reduce((sum: number, h: any) => sum + h.close, 0) / history.length,
    history: history,
    currency: data.currency,
    timestamp: new Date().toISOString(),
  };
}

async function populateCacheWithMock() {
  console.log("🚀 Populando cache com dados MOCK (exemplo)...\n");
  console.log("⚠️  AVISO: Estes são dados de exemplo para demonstração.\n");

  for (const [ticker, data] of Object.entries(MOCK_STOCK_DATA)) {
    try {
      console.log(`📊 Salvando dados MOCK para ${ticker}...`);
      
      // Cria resposta de histórico mockada
      const historyResponse = createMockHistoryResponse(ticker, data);
      
      // Salva no cache
      await db.upsertStockCache({
        ticker: ticker,
        normalizedTicker: `${ticker}.SA`,
        name: data.name,
        currentPrice: data.currentPrice,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changePercent,
        dayHigh: data.dayHigh,
        dayLow: data.dayLow,
        volume: data.volume,
        currency: data.currency,
        market: data.market,
        sector: data.sector,
        industry: data.industry,
        marketCap: data.marketCap,
        historyData: JSON.stringify(historyResponse),
      });

      console.log(`✅ ${ticker} (${data.name}) salvo no cache`);
      console.log(`   Preço: R$ ${data.currentPrice.toFixed(2)} (${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%)\n`);
    } catch (error) {
      console.error(`❌ Erro ao processar ${ticker}:`, error);
    }
  }

  console.log("✨ Cache populado com dados MOCK!");
  console.log("\n📝 NOTA: Estes são dados de exemplo. Para dados reais, configure a API do Yahoo Finance.");
  process.exit(0);
}

populateCacheWithMock().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});

