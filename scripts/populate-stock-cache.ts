/**
 * Script para popular o cache de ações com dados iniciais
 * Execute: pnpm tsx scripts/populate-stock-cache.ts
 */

import "dotenv/config";
import * as db from "../server/db";
import { stockService } from "../server/python-bridge";

const POPULAR_STOCKS = [
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "ABEV3",
  "WEGE3",
];

async function populateCache() {
  console.log("🚀 Iniciando popularização do cache de ações...\n");

  for (const ticker of POPULAR_STOCKS) {
    try {
      console.log(`📊 Buscando dados para ${ticker}...`);
      
      // Busca informações da ação
      const info = await stockService.getStockInfo(ticker);
      
      if (!info || !info.success) {
        console.error(`❌ Erro ao buscar info para ${ticker}:`, info?.error);
        continue;
      }

      // Busca histórico
      const history = await stockService.getStockHistory(ticker, "1mo", "1d");
      
      // Salva no cache
      await db.upsertStockCache({
        ticker: info.ticker,
        normalizedTicker: info.normalized_ticker,
        name: info.name,
        currentPrice: info.current_price,
        previousClose: info.previous_close,
        change: info.change,
        changePercent: info.change_percent,
        dayHigh: info.day_high,
        dayLow: info.day_low,
        volume: info.volume,
        currency: info.currency,
        market: info.market,
        sector: info.sector,
        industry: info.industry,
        marketCap: info.market_cap,
        historyData: history && history.success ? JSON.stringify(history) : null,
      });

      console.log(`✅ ${ticker} salvo no cache`);
      
      // Delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Erro ao processar ${ticker}:`, error);
    }
  }

  console.log("\n✨ Popularização concluída!");
  process.exit(0);
}

populateCache().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});

