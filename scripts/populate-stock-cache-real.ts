/**
 * Script para popular o cache de ações com dados REAIS do Yahoo Finance
 * Execute: pnpm tsx scripts/populate-stock-cache-real.ts
 * 
 * Este script tenta buscar dados reais com múltiplas estratégias e delays adequados
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

// Delay maior entre requisições para evitar rate limiting
const DELAY_BETWEEN_STOCKS = 3000; // 3 segundos
const DELAY_AFTER_ERROR = 5000; // 5 segundos após erro

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateCacheWithRealData() {
  console.log("🚀 Iniciando popularização do cache com dados REAIS do Yahoo Finance...\n");
  console.log("⏳ Este processo pode levar alguns minutos devido aos delays entre requisições.\n");

  const results = {
    success: [] as string[],
    failed: [] as Array<{ ticker: string; error: string }>,
  };

  for (let i = 0; i < POPULAR_STOCKS.length; i++) {
    const ticker = POPULAR_STOCKS[i];
    
    try {
      console.log(`\n[${i + 1}/${POPULAR_STOCKS.length}] 📊 Buscando dados REAIS para ${ticker}...`);
      
      // Busca informações da ação
      console.log(`   → Buscando informações básicas...`);
      const info = await stockService.getStockInfo(ticker);
      
      if (!info || !info.success) {
        const errorMsg = info?.error || "Erro desconhecido";
        console.error(`   ❌ Erro ao buscar info para ${ticker}: ${errorMsg}`);
        
        // Se for rate limit, aguarda mais tempo
        if (info?.rate_limited) {
          console.log(`   ⏳ Rate limit detectado. Aguardando ${DELAY_AFTER_ERROR / 1000}s...`);
          await sleep(DELAY_AFTER_ERROR);
          // Tenta novamente uma vez
          console.log(`   🔄 Tentando novamente...`);
          const retryInfo = await stockService.getStockInfo(ticker);
          if (retryInfo && retryInfo.success) {
            // Continua com o retry bem-sucedido
            Object.assign(info, retryInfo);
          } else {
            results.failed.push({ ticker, error: errorMsg });
            await sleep(DELAY_BETWEEN_STOCKS);
            continue;
          }
        } else {
          results.failed.push({ ticker, error: errorMsg });
          await sleep(DELAY_BETWEEN_STOCKS);
          continue;
        }
      }

      console.log(`   ✅ Informações obtidas: ${info.name || ticker} - R$ ${info.current_price?.toFixed(2) || 'N/A'}`);

      // Aguarda um pouco antes de buscar histórico
      await sleep(1000);

      // Busca histórico
      console.log(`   → Buscando histórico de preços...`);
      const history = await stockService.getStockHistory(ticker, "1mo", "1d");
      
      if (!history || !history.success) {
        console.warn(`   ⚠️  Histórico não disponível para ${ticker}, mas salvando informações básicas...`);
      } else {
        console.log(`   ✅ Histórico obtido: ${history.data_points || 0} pontos de dados`);
      }
      
      // Salva no cache
      console.log(`   → Salvando no cache...`);
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

      console.log(`   ✅ ${ticker} salvo no cache com sucesso!`);
      results.success.push(ticker);
      
      // Delay entre ações para evitar rate limiting
      if (i < POPULAR_STOCKS.length - 1) {
        console.log(`   ⏳ Aguardando ${DELAY_BETWEEN_STOCKS / 1000}s antes da próxima ação...`);
        await sleep(DELAY_BETWEEN_STOCKS);
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`   ❌ Erro ao processar ${ticker}: ${errorMsg}`);
      results.failed.push({ ticker, error: errorMsg });
      
      // Aguarda mais tempo após erro
      await sleep(DELAY_AFTER_ERROR);
    }
  }

  // Resumo
  console.log("\n" + "=".repeat(60));
  console.log("✨ Popularização concluída!");
  console.log("=".repeat(60));
  console.log(`\n✅ Sucesso: ${results.success.length}/${POPULAR_STOCKS.length} ações`);
  if (results.success.length > 0) {
    console.log(`   Ações processadas: ${results.success.join(", ")}`);
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Falhas: ${results.failed.length}/${POPULAR_STOCKS.length} ações`);
    results.failed.forEach(({ ticker, error }) => {
      console.log(`   - ${ticker}: ${error}`);
    });
    console.log("\n💡 Dica: Se muitas ações falharam, pode ser rate limiting do Yahoo Finance.");
    console.log("   Tente executar o script novamente em alguns minutos.");
  }
  
  console.log("\n📝 Os dados estão agora no cache e serão usados pelo frontend.");
  console.log("   O cache é válido por 15 minutos antes de tentar atualizar da API.\n");
  
  process.exit(results.failed.length === POPULAR_STOCKS.length ? 1 : 0);
}

populateCacheWithRealData().catch((error) => {
  console.error("\n❌ Erro fatal:", error);
  process.exit(1);
});

