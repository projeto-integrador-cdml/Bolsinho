import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { groqService, ocrService, newsService, stockService, calculatorService } from "./python-bridge";
import { storagePut } from "./storage";
import { invokeLLM, type Message } from "./_core/llm";
import { ENV } from "./_core/env";
import { processFileForPython } from "./_core/tempFiles";
import * as db from "./db";

/**
 * Detecta se a mensagem do usuário está pedindo notícias financeiras
 */
function detectNewsRequest(message: string): { isNewsRequest: boolean; queryType?: 'headlines' | 'search' | 'investment' | 'sector' | 'indicators'; query?: string; category?: string; sector?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Palavras-chave para detectar solicitações de notícias
  const newsKeywords = [
    'notícias', 'noticia', 'noticias', 'news',
    'manchetes', 'manchete',
    'últimas notícias', 'ultimas noticias',
    'o que está acontecendo', 'o que esta acontecendo',
    'o que aconteceu', 'o que aconteceu hoje',
    'notícias de hoje', 'noticias de hoje',
    'atualidades', 'atualidade'
  ];
  
  // Verifica se é uma solicitação de notícias
  const isNewsRequest = newsKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!isNewsRequest) {
    return { isNewsRequest: false };
  }
  
  // Detecta tipo específico de notícia
  if (lowerMessage.includes('manchetes') || lowerMessage.includes('principais') || lowerMessage.includes('top')) {
    return { isNewsRequest: true, queryType: 'headlines' };
  }
  
  if (lowerMessage.includes('investimento') || lowerMessage.includes('ações') || lowerMessage.includes('bolsa') || 
      lowerMessage.includes('cripto') || lowerMessage.includes('bitcoin') || lowerMessage.includes('fundo')) {
    return { isNewsRequest: true, queryType: 'investment' };
  }
  
  if (lowerMessage.includes('ibovespa') || lowerMessage.includes('dólar') || lowerMessage.includes('dolar') || 
      lowerMessage.includes('selic') || lowerMessage.includes('inflação') || lowerMessage.includes('inflacao') || 
      lowerMessage.includes('ipca') || lowerMessage.includes('pib')) {
    return { isNewsRequest: true, queryType: 'indicators' };
  }
  
  if (lowerMessage.includes('setor') || lowerMessage.includes('tecnologia') || lowerMessage.includes('energia') || 
      lowerMessage.includes('saúde') || lowerMessage.includes('saude') || lowerMessage.includes('financeiro') || 
      lowerMessage.includes('varejo') || lowerMessage.includes('agronegócio') || lowerMessage.includes('agronegocio')) {
    // Tenta extrair o setor específico
    const sectors: Record<string, string> = {
      'tecnologia': 'tecnologia',
      'tech': 'tecnologia',
      'energia': 'energia',
      'petróleo': 'energia',
      'petroleo': 'energia',
      'saúde': 'saude',
      'saude': 'saude',
      'farmacêutica': 'saude',
      'farmaceutica': 'saude',
      'financeiro': 'financeiro',
      'banco': 'financeiro',
      'fintech': 'financeiro',
      'varejo': 'varejo',
      'e-commerce': 'varejo',
      'agronegócio': 'agronegocio',
      'agronegocio': 'agronegocio',
      'agricultura': 'agronegocio'
    };
    
    for (const [keyword, sector] of Object.entries(sectors)) {
      if (lowerMessage.includes(keyword)) {
        return { isNewsRequest: true, queryType: 'sector', sector };
      }
    }
    
    return { isNewsRequest: true, queryType: 'sector' };
  }
  
  // Se não for um tipo específico, usa busca geral
  // Tenta extrair termos de busca da mensagem
  const searchTerms = message.match(/(?:sobre|sobre o|sobre a|de|do|da)\s+([a-záêçõúã]+(?:\s+[a-záêçõúã]+)*)/gi);
  if (searchTerms && searchTerms.length > 0) {
    const query = searchTerms[0].replace(/(?:sobre|sobre o|sobre a|de|do|da)\s+/i, '').trim();
    return { isNewsRequest: true, queryType: 'search', query };
  }
  
  return { isNewsRequest: true, queryType: 'headlines' };
}

/**
 * Detecta se a mensagem do usuário está pedindo informações sobre ações
 */
function detectStockRequest(message: string): { isStockRequest: boolean; ticker?: string; period?: string; action?: 'info' | 'variation' | 'history' } {
  const lowerMessage = message.toLowerCase();
  
  // Palavras-chave para detectar solicitações de ações
  const stockKeywords = [
    'ação', 'acoes', 'ações', 'stock', 'stocks',
    'petrobras', 'vale', 'itau', 'bradesco', 'ambev', 'weg',
    'petr4', 'vale3', 'itub4', 'bbdc4', 'abev3', 'wege3',
    'variação', 'variacao', 'variação da', 'variacao da',
    'como está', 'como esta', 'como ta', 'preço', 'preco',
    'cotação', 'cotacao', 'valor da ação', 'valor da acao',
    'histórico', 'historico', 'gráfico', 'grafico',
    'performance', 'rentabilidade', 'retorno'
  ];
  
  // Verifica se é uma solicitação de ações
  const isStockRequest = stockKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!isStockRequest) {
    return { isStockRequest: false };
  }
  
  // Tenta extrair o ticker da mensagem
  // Padrões: "PETR4", "PETR4.SA", "ação PETR4", "PETR4 variação"
  // Regex para encontrar tickers brasileiros (4 letras + 1-2 dígitos) ou com .SA
  const tickerRegex = /\b([A-Z]{4}\d{1,2}(?:\.SA)?)\b/gi;
  const matches = message.match(tickerRegex);
  
  let ticker: string | undefined;
  if (matches && matches.length > 0) {
    // Pega o primeiro match e garante que está em maiúsculas
    ticker = matches[0].toUpperCase();
  }
  
  // Se não encontrou por regex, tenta padrões mais flexíveis
  if (!ticker) {
    const flexiblePatterns = [
      /(?:ação|acao|stock|da|de|a)\s+([A-Z]{4}\d{1,2})/gi,
      /([A-Z]{4}\d{1,2})\s+(?:variação|variacao|preço|preco|cotação|cotacao|esta|está)/gi,
    ];
    
    for (const pattern of flexiblePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        ticker = match[1].toUpperCase();
        break;
      }
    }
  }
  
  // Se não encontrou ticker, tenta buscar por nomes de empresas conhecidas
  if (!ticker) {
    const companyMap: Record<string, string> = {
      'petrobras': 'PETR4',
      'vale': 'VALE3',
      'itau': 'ITUB4',
      'itaú': 'ITUB4',
      'bradesco': 'BBDC4',
      'ambev': 'ABEV3',
      'weg': 'WEGE3',
      'localiza': 'RENT3',
      'suzano': 'SUZB3',
      'raia': 'RADL3',
      'eletrobras': 'ELET3',
      'banco do brasil': 'BBAS3',
      'santander': 'SANB11',
      'embraer': 'EMBR3',
    };
    
    for (const [company, tick] of Object.entries(companyMap)) {
      if (lowerMessage.includes(company)) {
        ticker = tick;
        break;
      }
    }
  }
  
  // Detecta período solicitado
  let period = '1mo'; // padrão: 1 mês
  if (lowerMessage.includes('hoje') || lowerMessage.includes('dia')) {
    period = '1d';
  } else if (lowerMessage.includes('semana')) {
    period = '5d';
  } else if (lowerMessage.includes('mês') || lowerMessage.includes('mes') || lowerMessage.includes('mês')) {
    period = '1mo';
  } else if (lowerMessage.includes('trimestre') || lowerMessage.includes('3 meses')) {
    period = '3mo';
  } else if (lowerMessage.includes('semestre') || lowerMessage.includes('6 meses')) {
    period = '6mo';
  } else if (lowerMessage.includes('ano') || lowerMessage.includes('1 ano')) {
    period = '1y';
  }
  
  // Detecta tipo de ação
  let action: 'info' | 'variation' | 'history' = 'info';
  if (lowerMessage.includes('variação') || lowerMessage.includes('variacao') || lowerMessage.includes('variou')) {
    action = 'variation';
  } else if (lowerMessage.includes('histórico') || lowerMessage.includes('historico') || lowerMessage.includes('gráfico') || lowerMessage.includes('grafico')) {
    action = 'history';
  }
  
  return {
    isStockRequest: true,
    ticker,
    period,
    action
  };
}

/**
 * Detecta se a mensagem do usuário está pedindo cálculos financeiros
 */
function detectCalculationRequest(message: string): { isCalculationRequest: boolean; calculationType?: 'distribution' | 'percentage' | 'compound_interest' | 'general'; details?: any } {
  const lowerMessage = message.toLowerCase();
  
  // Palavras-chave para detectar solicitações de cálculos
  const calculationKeywords = [
    'calcular', 'calcule', 'somar', 'soma', 'total',
    'distribuir', 'dividir', 'alocar', 'investir',
    'percentual', 'porcentagem', '%', 'porcento',
    'juros', 'rendimento', 'juros compostos',
    'quanto', 'quanto é', 'quanto dá'
  ];
  
  // Verifica se é uma solicitação de cálculo
  const isCalculationRequest = calculationKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!isCalculationRequest) {
    return { isCalculationRequest: false };
  }
  
  // Detecta tipo de cálculo
  let calculationType: 'distribution' | 'percentage' | 'compound_interest' | 'general' = 'general';
  
  if (lowerMessage.includes('distribuir') || lowerMessage.includes('dividir') || lowerMessage.includes('alocar') || 
      lowerMessage.includes('investir') && (lowerMessage.includes('total') || lowerMessage.includes('mil') || /\d+/.test(message))) {
    calculationType = 'distribution';
  } else if (lowerMessage.includes('percentual') || lowerMessage.includes('porcentagem') || lowerMessage.includes('%') || 
             lowerMessage.includes('porcento')) {
    calculationType = 'percentage';
  } else if (lowerMessage.includes('juros') || lowerMessage.includes('rendimento') || lowerMessage.includes('compostos')) {
    calculationType = 'compound_interest';
  }
  
  return {
    isCalculationRequest: true,
    calculationType
  };
}

/**
 * Processa cálculos financeiros baseado na solicitação detectada
 */
async function processFinancialCalculations(message: string): Promise<string | null> {
  try {
    // Primeiro, tenta analisar a pergunta para extrair informações
    const parsed = await calculatorService.parseFinancialQuestion(message);
    
    if (!parsed.total_amount && parsed.calculation_type !== 'percentage') {
      return null; // Sem informações suficientes para calcular
    }
    
    // Se for distribuição de investimentos
    if (parsed.calculation_type === 'distribution' && parsed.total_amount) {
      let result;
      
      if (parsed.percentages && parsed.percentages.length > 0) {
        // Distribuição por percentuais
        result = await calculatorService.calculateInvestmentDistribution(
          parsed.total_amount,
          parsed.percentages,
          undefined,
          parsed.targets
        );
      } else if (parsed.amounts && parsed.amounts.length > 0) {
        // Distribuição por valores específicos
        result = await calculatorService.calculateInvestmentDistribution(
          parsed.total_amount,
          undefined,
          parsed.amounts,
          parsed.targets
        );
      } else {
        // Se não tem percentuais nem valores, não pode calcular
        return null;
      }
      
      if (result.success) {
        // Formata o resultado para incluir no contexto
        let output = `\n\n--- CÁLCULO DE DISTRIBUIÇÃO DE INVESTIMENTOS (CALCULADO PRECISAMENTE) ---\n`;
        output += `Total disponível: ${result.formatted_total}\n\n`;
        output += `Distribuição:\n`;
        result.distribution.forEach((item: any, index: number) => {
          output += `${index + 1}. ${item.target}: ${item.formatted_amount} (${item.percentage}%)\n`;
        });
        output += `\n${result.summary}\n`;
        if (result.is_correct) {
          output += `✅ Soma verificada: Os valores somam exatamente o total!\n`;
        } else {
          output += `⚠️ Diferença de arredondamento: ${Math.abs(result.difference).toFixed(2)}\n`;
        }
        output += `--- FIM DO CÁLCULO ---\n`;
        return output;
      }
    }
    
    // Se for cálculo de percentual
    if (parsed.calculation_type === 'percentage' && parsed.amounts && parsed.amounts.length >= 2) {
      const value = parsed.amounts[0];
      const total = parsed.total_amount || parsed.amounts[1] || parsed.amounts.reduce((a: number, b: number) => a + b, 0);
      const result = await calculatorService.calculatePercentage(value, total);
      
      if (result.success) {
        return `\n\n--- CÁLCULO DE PERCENTUAL (CALCULADO PRECISAMENTE) ---\n` +
               `Valor: R$ ${result.value.toFixed(2)}\n` +
               `Total: R$ ${result.total.toFixed(2)}\n` +
               `Percentual: ${result.formatted}\n` +
               `--- FIM DO CÁLCULO ---\n`;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('[Chat] Erro ao processar cálculos financeiros:', error);
    return null; // Retorna null em caso de erro para não interromper o fluxo
  }
}

/**
 * Busca dados de ações baseado na solicitação detectada
 */
async function fetchStockData(detection: { ticker?: string; period?: string; action?: string }): Promise<string | null> {
  try {
    if (!detection.ticker) {
      return null; // Sem ticker, não pode buscar
    }
    
    const ticker = detection.ticker;
    const period = detection.period || '1mo';
    
    if (detection.action === 'variation') {
      // Busca apenas variação
      const variation = await stockService.getStockVariation(ticker, period);
      if (variation.success) {
        return `Dados da ação ${variation.name} (${variation.ticker}):\n` +
               `- Período: ${period}\n` +
               `- Preço inicial: ${variation.currency} ${variation.start_price}\n` +
               `- Preço final: ${variation.currency} ${variation.end_price}\n` +
               `- Variação: ${variation.change >= 0 ? '+' : ''}${variation.change} (${variation.change_percent >= 0 ? '+' : ''}${variation.change_percent}%)\n`;
      }
    } else if (detection.action === 'history') {
      // Busca histórico completo
      const history = await stockService.getStockHistory(ticker, period, '1d');
      if (history.success) {
        return `Histórico da ação ${ticker} (${period}):\n` +
               `- Período: ${history.first_date} a ${history.last_date}\n` +
               `- Preço inicial: ${history.first_close}\n` +
               `- Preço final: ${history.last_close}\n` +
               `- Variação: ${history.period_change >= 0 ? '+' : ''}${history.period_change} (${history.period_change_percent >= 0 ? '+' : ''}${history.period_change_percent}%)\n` +
               `- Máxima: ${history.high_price}\n` +
               `- Mínima: ${history.low_price}\n` +
               `- Média: ${history.avg_price}\n` +
               `- Pontos de dados: ${history.data_points}\n`;
      }
    } else {
      // Busca informações gerais
      const info = await stockService.getStockInfo(ticker);
      if (info.success) {
        return `Informações da ação ${info.name} (${info.ticker}):\n` +
               `- Preço atual: ${info.currency} ${info.current_price}\n` +
               `- Variação do dia: ${info.change >= 0 ? '+' : ''}${info.change} (${info.change_percent >= 0 ? '+' : ''}${info.change_percent}%)\n` +
               `- Máxima do dia: ${info.day_high}\n` +
               `- Mínima do dia: ${info.day_low}\n` +
               `- Volume: ${info.volume?.toLocaleString() || 'N/A'}\n` +
               (info.sector ? `- Setor: ${info.sector}\n` : '') +
               (info.industry ? `- Indústria: ${info.industry}\n` : '') +
               `- Mercado: ${info.market}\n`;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('[Chat] Erro ao buscar dados de ações:', error);
    return null; // Retorna null em caso de erro para não interromper o fluxo
  }
}

/**
 * Busca notícias baseado no tipo de solicitação detectado
 */
async function fetchRelevantNews(detection: { queryType: string; query?: string; category?: string; sector?: string }): Promise<string | null> {
  try {
    let newsResult;
    
    switch (detection.queryType) {
      case 'headlines':
        newsResult = await newsService.getTopHeadlines('business', 'br', 10);
        break;
      
      case 'investment':
        newsResult = await newsService.getInvestmentNews(undefined, 10);
        break;
      
      case 'indicators':
        newsResult = await newsService.getMarketIndicatorsNews(10);
        break;
      
      case 'sector':
        const sector = detection.sector || 'tecnologia';
        newsResult = await newsService.getSectorNews(sector, 10);
        break;
      
      case 'search':
        const query = detection.query || 'economia financeiro';
        newsResult = await newsService.searchNews(query, { language: 'pt', page_size: 10 });
        break;
      
      default:
        newsResult = await newsService.getTopHeadlines('business', 'br', 10);
    }
    
    if (!newsResult.success || !newsResult.data) {
      console.warn('[Chat] Erro ao buscar notícias:', newsResult.error);
      return null;
    }
    
    const news = Array.isArray(newsResult.data) ? newsResult.data : [];
    
    // Verifica se há erro na resposta
    if (news.length > 0 && news[0].error) {
      console.warn('[Chat] Erro nas notícias:', news[0].error);
      return null;
    }
    
    if (news.length === 0) {
      console.warn('[Chat] Nenhuma notícia encontrada');
      return null;
    }
    
    // Formata as notícias para incluir no contexto
    const newsText = news.slice(0, 5).map((article: any, index: number) => {
      return `${index + 1}. ${article.title || 'Sem título'}
${article.description ? `   ${article.description.substring(0, 200)}...` : ''}
   Fonte: ${article.source || 'Desconhecida'} | Publicado: ${article.published_at || 'Data desconhecida'}
   URL: ${article.url || 'N/A'}`;
    }).join('\n\n');
    
    return `\n\n--- NOTÍCIAS FINANCEIRAS ATUAIS ---\n${newsText}\n--- FIM DAS NOTÍCIAS ---\n`;
  } catch (error) {
    console.error('[Chat] Erro ao buscar notícias:', error);
    return null;
  }
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  
  // Stock API endpoints for frontend
  stocks: router({
    info: publicProcedure
      .input(z.object({ ticker: z.string() }))
      .query(async ({ input }) => {
        const ticker = input.ticker.toUpperCase();
        
        // Tenta buscar do cache primeiro
        const cached = await db.getStockFromCache(ticker);
        const isStale = await db.isStockCacheStale(ticker, 15); // 15 minutos
        
        // Se tem cache válido (não está antigo), retorna do cache
        if (cached && !isStale) {
          console.log(`[Stocks] Retornando ${ticker} do cache`);
          return {
            success: true,
            ticker: cached.ticker,
            normalized_ticker: cached.normalizedTicker || cached.ticker,
            symbol: cached.ticker,
            name: cached.name || cached.ticker,
            current_price: cached.currentPrice ? cached.currentPrice / 100 : null,
            previous_close: cached.previousClose ? cached.previousClose / 100 : null,
            change: cached.change ? cached.change / 100 : 0,
            change_percent: cached.changePercent ? cached.changePercent / 100 : 0,
            day_high: cached.dayHigh ? cached.dayHigh / 100 : null,
            day_low: cached.dayLow ? cached.dayLow / 100 : null,
            volume: cached.volume || null,
            currency: cached.currency || "BRL",
            market: cached.market || "B3",
            sector: cached.sector || null,
            industry: cached.industry || null,
            market_cap: cached.marketCap || null,
            timestamp: cached.lastUpdated?.toISOString() || new Date().toISOString(),
          };
        }
        
        // Se não tem cache ou está antigo, busca da API
        console.log(`[Stocks] Buscando ${ticker} da API (cache ${cached ? 'antigo' : 'não existe'})`);
        const result = await stockService.getStockInfo(ticker);
        
        // Se conseguiu buscar da API, salva no cache
        if (result && result.success) {
          try {
            await db.upsertStockCache({
              ticker: result.ticker,
              normalizedTicker: result.normalized_ticker,
              name: result.name,
              currentPrice: result.current_price,
              previousClose: result.previous_close,
              change: result.change,
              changePercent: result.change_percent,
              dayHigh: result.day_high,
              dayLow: result.day_low,
              volume: result.volume,
              currency: result.currency,
              market: result.market,
              sector: result.sector,
              industry: result.industry,
              marketCap: result.market_cap,
            });
          } catch (error) {
            console.error(`[Stocks] Erro ao salvar ${ticker} no cache:`, error);
          }
        } else if (cached) {
          // Se a API falhou mas tem cache (mesmo que antigo), retorna o cache
          console.log(`[Stocks] API falhou para ${ticker}, usando cache antigo`);
          return {
            success: true,
            ticker: cached.ticker,
            normalized_ticker: cached.normalizedTicker || cached.ticker,
            symbol: cached.ticker,
            name: cached.name || cached.ticker,
            current_price: cached.currentPrice ? cached.currentPrice / 100 : null,
            previous_close: cached.previousClose ? cached.previousClose / 100 : null,
            change: cached.change ? cached.change / 100 : 0,
            change_percent: cached.changePercent ? cached.changePercent / 100 : 0,
            day_high: cached.dayHigh ? cached.dayHigh / 100 : null,
            day_low: cached.dayLow ? cached.dayLow / 100 : null,
            volume: cached.volume || null,
            currency: cached.currency || "BRL",
            market: cached.market || "B3",
            sector: cached.sector || null,
            industry: cached.industry || null,
            market_cap: cached.marketCap || null,
            timestamp: cached.lastUpdated?.toISOString() || new Date().toISOString(),
          };
        }
        
        return result;
      }),
    
    history: publicProcedure
      .input(z.object({
        ticker: z.string(),
        period: z.string().optional().default("1mo"),
        interval: z.string().optional().default("1d"),
      }))
      .query(async ({ input }) => {
        const ticker = input.ticker.toUpperCase();
        
        // Tenta buscar do cache primeiro
        const cached = await db.getStockFromCache(ticker);
        
        // Se tem cache com histórico, retorna
        if (cached && cached.historyData) {
          try {
            const history = JSON.parse(cached.historyData);
            const isStale = await db.isStockCacheStale(ticker, 15);
            
            if (!isStale) {
              console.log(`[Stocks] Retornando histórico de ${ticker} do cache`);
              return history;
            }
          } catch (error) {
            console.error(`[Stocks] Erro ao parsear histórico do cache para ${ticker}:`, error);
          }
        }
        
        // Busca da API
        console.log(`[Stocks] Buscando histórico de ${ticker} da API`);
        const result = await stockService.getStockHistory(input.ticker, input.period, input.interval);
        
        // Se conseguiu buscar da API, salva no cache
        if (result && result.success) {
          try {
            // Atualiza também os dados básicos se não tiver cache
            const existingCache = await db.getStockFromCache(ticker);
            if (!existingCache || !existingCache.name) {
              // Busca info básica também para ter dados completos
              const info = await stockService.getStockInfo(ticker);
              if (info && info.success) {
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
                  historyData: JSON.stringify(result),
                });
              }
            } else {
              // Só atualiza o histórico
              await db.upsertStockCache({
                ticker: result.ticker,
                normalizedTicker: result.normalized_ticker,
                historyData: JSON.stringify(result),
              });
            }
          } catch (error) {
            console.error(`[Stocks] Erro ao salvar histórico de ${ticker} no cache:`, error);
          }
        } else if (cached && cached.historyData) {
          // Se a API falhou mas tem cache, retorna o cache
          try {
            const history = JSON.parse(cached.historyData);
            console.log(`[Stocks] API falhou para histórico de ${ticker}, usando cache`);
            return history;
          } catch (error) {
            console.error(`[Stocks] Erro ao parsear histórico do cache para ${ticker}:`, error);
          }
        }
        
        return result;
      }),
    
    variation: publicProcedure
      .input(z.object({
        ticker: z.string(),
        period: z.string().optional().default("1mo"),
      }))
      .query(async ({ input }) => {
        try {
          const result = await stockService.getStockVariation(input.ticker, input.period);
          return result;
        } catch (error) {
          console.error("[Stocks] Erro ao calcular variação:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao calcular variação da ação");
        }
      }),
    
    search: publicProcedure
      .input(z.object({
        query: z.string(),
        limit: z.number().optional().default(5),
      }))
      .query(async ({ input }) => {
        try {
          const result = await stockService.searchStocks(input.query, input.limit);
          return result;
        } catch (error) {
          console.error("[Stocks] Erro ao buscar ações:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao buscar ações");
        }
      }),
    
    // Endpoint para atualizar cache (pode ser chamado por cron job)
    updateCache: publicProcedure
      .input(z.object({ ticker: z.string().optional() }))
      .mutation(async ({ input }) => {
        const tickers = input.ticker 
          ? [input.ticker.toUpperCase()]
          : ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", "WEGE3"];
        
        const results = [];
        
        for (const ticker of tickers) {
          try {
            console.log(`[Stocks] Atualizando cache para ${ticker}`);
            const info = await stockService.getStockInfo(ticker);
            const history = await stockService.getStockHistory(ticker, "1mo", "1d");
            
            if (info && info.success) {
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
              results.push({ ticker, success: true });
            } else {
              results.push({ ticker, success: false, error: info?.error });
            }
            
            // Delay entre requisições para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`[Stocks] Erro ao atualizar cache para ${ticker}:`, error);
            results.push({ ticker, success: false, error: error instanceof Error ? error.message : "Erro desconhecido" });
          }
        }
        
        return { results };
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => {
      return {
        user: opts.ctx.user,
        isAuthenticated: opts.ctx.user !== null,
      };
    }),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { registerUser, createUserSession } = await import("./_core/auth");
          const user = await registerUser(input.email, input.password, input.name);
          await createUserSession(user, ctx.req, ctx.res);
          
          return {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          };
        } catch (error) {
          console.error("[Auth] Register error:", error);
          throw new Error(error instanceof Error ? error.message : "Erro ao registrar usuário");
        }
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { loginUser, createUserSession } = await import("./_core/auth");
          const user = await loginUser(input.email, input.password);
          await createUserSession(user, ctx.req, ctx.res);
          
          return {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          };
        } catch (error) {
          console.error("[Auth] Login error:", error);
          throw new Error(error instanceof Error ? error.message : "Email ou senha incorretos");
        }
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dashboard endpoints
  dashboard: router({
    stats: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return {
          portfolioTotal: 0,
          monthlyReturn: 0,
          monitoredStocks: 6,
          investmentsCount: 0,
        };
      }
      
      try {
        const stats = await db.getDashboardStats(ctx.user.id);
        return stats;
      } catch (error) {
        console.error("[Dashboard] Error getting stats:", error);
        return {
          portfolioTotal: 0,
          monthlyReturn: 0,
          monitoredStocks: 6,
          investmentsCount: 0,
        };
      }
    }),
  }),
  
  // Investments endpoints
  investments: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Usuário não autenticado");
      }
      
      try {
        const investments = await db.getUserInvestments(ctx.user.id);
        return investments;
      } catch (error) {
        console.error("[Investments] Error listing:", error);
        throw new Error("Erro ao buscar investimentos");
      }
    }),
    
    create: publicProcedure
      .input(z.object({
        ticker: z.string().min(1),
        name: z.string().optional(),
        quantity: z.number().min(0),
        averagePrice: z.number().min(0),
        totalInvested: z.number().min(0),
        currency: z.string().default("BRL"),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Usuário não autenticado");
        }
        
        try {
          // Convert prices to cents (assuming input is in reais/dollars)
          const averagePriceInCents = Math.round(input.averagePrice * 100);
          const totalInvestedInCents = Math.round(input.totalInvested * 100);
          
          await db.createInvestment({
            userId: ctx.user.id,
            ticker: input.ticker.toUpperCase(),
            name: input.name || null,
            quantity: input.quantity,
            averagePrice: averagePriceInCents,
            totalInvested: totalInvestedInCents,
            currentValue: totalInvestedInCents, // Initial value equals invested
            currency: input.currency,
            notes: input.notes || null,
          });
          
          return { success: true };
        } catch (error) {
          console.error("[Investments] Error creating:", error);
          throw new Error("Erro ao criar investimento");
        }
      }),
    
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        quantity: z.number().min(0).optional(),
        averagePrice: z.number().min(0).optional(),
        totalInvested: z.number().min(0).optional(),
        currentValue: z.number().min(0).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Usuário não autenticado");
        }
        
        try {
          const updates: any = {};
          if (input.quantity !== undefined) updates.quantity = input.quantity;
          if (input.averagePrice !== undefined) updates.averagePrice = Math.round(input.averagePrice * 100);
          if (input.totalInvested !== undefined) updates.totalInvested = Math.round(input.totalInvested * 100);
          if (input.currentValue !== undefined) updates.currentValue = Math.round(input.currentValue * 100);
          if (input.notes !== undefined) updates.notes = input.notes;
          
          await db.updateInvestment(input.id, ctx.user.id, updates);
          return { success: true };
        } catch (error) {
          console.error("[Investments] Error updating:", error);
          throw new Error("Erro ao atualizar investimento");
        }
      }),
    
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Usuário não autenticado");
        }
        
        try {
          await db.deleteInvestment(input.id, ctx.user.id);
          return { success: true };
        } catch (error) {
          console.error("[Investments] Error deleting:", error);
          throw new Error("Erro ao deletar investimento");
        }
      }),
  }),
  
  // Upload de arquivos (imagens e áudio)
  upload: router({
    file: publicProcedure
      .input(z.object({
        file: z.string(), // base64 encoded file
        filename: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Validate file type
          const isImage = input.mimeType.startsWith('image/');
          const isAudio = input.mimeType.startsWith('audio/');
          const isPdf = input.mimeType === 'application/pdf';
          
          if (!isImage && !isAudio && !isPdf) {
            throw new Error('Tipo de arquivo não suportado. Apenas imagens, áudio e PDFs são permitidos.');
          }
          
          // Try to use storage if configured, otherwise use data URL
          try {
            // Decode base64 to buffer
            const buffer = Buffer.from(input.file, 'base64');
            
            // Determine file type and path
            let filePath: string;
            if (isImage) {
              const ext = input.mimeType.split('/')[1] || 'png';
              filePath = `chat/images/${Date.now()}-${input.filename || `image.${ext}`}`;
            } else if (isAudio) {
              const ext = input.mimeType.split('/')[1] || 'mp3';
              filePath = `chat/audio/${Date.now()}-${input.filename || `audio.${ext}`}`;
            } else if (isPdf) {
              filePath = `chat/pdfs/${Date.now()}-${input.filename || 'document.pdf'}`;
            } else {
              throw new Error('Tipo de arquivo não reconhecido.');
            }
            
            // Try to upload to storage
            const { url } = await storagePut(filePath, buffer, input.mimeType);
            
            return {
              success: true,
              url,
            };
          } catch (storageError) {
            // If storage is not configured, use data URL as fallback
            // This works for multimodal models that accept data URLs
            console.warn("[Upload] Storage não configurado, usando data URL:", storageError instanceof Error ? storageError.message : String(storageError));
            
            // Create data URL from base64
            const dataUrl = `data:${input.mimeType};base64,${input.file}`;
            
            return {
              success: true,
              url: dataUrl,
              isDataUrl: true, // Flag to indicate this is a data URL
            };
          }
        } catch (error) {
          console.error("[Upload] Erro ao processar arquivo:", error);
          throw new Error(error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo");
        }
      }),
  }),

  // Chatbot financeiro com suporte multimodal
  chat: router({
    send: publicProcedure
      .input(z.object({
        message: z.string().optional(),
        images: z.array(z.string()).optional(), // URLs das imagens
        audio: z.string().optional(), // URL do áudio
        pdfs: z.array(z.string()).optional(), // URLs dos PDFs
        conversationHistory: z.array(z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.union([
            z.string(),
            z.object({
              type: z.literal("text"),
              text: z.string(),
            }),
            z.object({
              type: z.literal("image_url"),
              image_url: z.object({
                url: z.string(),
              }),
            }),
            z.object({
              type: z.literal("file_url"),
              file_url: z.object({
                url: z.string(),
                mime_type: z.string().optional(),
              }),
            }),
            z.array(z.union([
              z.object({
                type: z.literal("text"),
                text: z.string(),
              }),
              z.object({
                type: z.literal("image_url"),
                image_url: z.object({
                  url: z.string(),
                }),
              }),
              z.object({
                type: z.literal("file_url"),
                file_url: z.object({
                  url: z.string(),
                  mime_type: z.string().optional(),
                }),
              }),
            ])),
          ]),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Process PDFs first - extract text from PDFs and add to message
          let pdfTexts: string[] = [];
          const tempFileCleanups: Array<() => Promise<void>> = [];
          
          if (input.pdfs && input.pdfs.length > 0) {
            for (const pdfUrl of input.pdfs) {
              let tempFilePath: string | null = null;
              let cleanup: (() => Promise<void>) | null = null;
              try {
                // Save to temp file if needed (data URL or very long URL)
                const fileInfo = await processFileForPython(pdfUrl, 'pdf');
                tempFilePath = fileInfo.path;
                cleanup = fileInfo.cleanup;
                tempFileCleanups.push(cleanup);
                
                console.log(`[Chat] Processando PDF: ${tempFilePath.length > 50 ? tempFilePath.substring(0, 50) + '...' : tempFilePath}`);
                
                // Extract text from PDF
                const result = await ocrService.extractTextFromPdf(tempFilePath);
                
                console.log(`[Chat] Resultado do OCR:`, result.success ? 'Sucesso' : `Erro: ${result.error}`);
                
                if (result.success && result.data) {
                  // OCR service returns string directly, check if it's an error message
                  const extractedText = typeof result.data === 'string' ? result.data : String(result.data);
                  
                  // Check if the returned string is actually an error message
                  const isError = extractedText.toLowerCase().startsWith('erro') || 
                                 extractedText.toLowerCase().startsWith('error') ||
                                 extractedText.toLowerCase().includes('erro ao extrair') ||
                                 extractedText.toLowerCase().includes('não foi possível extrair') ||
                                 extractedText.toLowerCase().includes('bibliotecas de pdf não disponíveis') ||
                                 (extractedText.length < 50 && extractedText.toLowerCase().includes('não foi possível'));
                  
                  if (!isError && extractedText.trim().length > 50) {
                    // Success - we got actual text content
                    pdfTexts.push(`\n\n--- Conteúdo extraído do PDF ---\n${extractedText}`);
                    console.log(`[Chat] Texto extraído do PDF com sucesso (${extractedText.length} caracteres)`);
                  } else {
                    // Error or empty result
                    console.warn(`[Chat] PDF processado mas resultado indica erro ou vazio. Resultado: ${extractedText.substring(0, 300)}`);
                    
                    // Provide helpful error message based on the error type
                    if (extractedText.toLowerCase().includes('poppler') || 
                        extractedText.toLowerCase().includes('is poppler installed')) {
                      pdfTexts.push(`\n\n--- ⚠️ Poppler não está instalado. Para processar PDFs escaneados, é necessário instalar o Poppler:\n\nWindows: Baixe em https://github.com/oschwartz10612/poppler-windows/releases/ e adicione a pasta 'bin' ao PATH do sistema.\n\nLinux: sudo apt-get install poppler-utils\n\nmacOS: brew install poppler\n\nAlternativamente, tente usar um PDF com texto selecionável (não escaneado). ---`);
                    } else if (extractedText.toLowerCase().includes('bibliotecas de pdf não disponíveis') || 
                        extractedText.toLowerCase().includes('instale pypdf2')) {
                      pdfTexts.push(`\n\n--- Erro: Bibliotecas Python necessárias não estão instaladas. Execute: pip install PyPDF2 pdf2image ---`);
                    } else if (extractedText.toLowerCase().includes('imagem escaneada') || 
                              extractedText.toLowerCase().includes('baixa qualidade')) {
                      pdfTexts.push(`\n\n--- Aviso: O PDF parece ser uma imagem escaneada de baixa qualidade. Não foi possível extrair texto. Tente usar um PDF com texto selecionável ou descreva o conteúdo em texto. ---`);
                    } else if (extractedText.toLowerCase().includes('vazio') || 
                              extractedText.toLowerCase().includes('empty')) {
                      pdfTexts.push(`\n\n--- Aviso: O PDF parece estar vazio ou não contém texto extraível. ---`);
                    } else {
                      // Generic error - extract the error message if available
                      const errorMatch = extractedText.match(/erro[:\s]+(.+)/i);
                      const errorDetail = errorMatch ? errorMatch[1].substring(0, 200) : 'Erro desconhecido';
                      pdfTexts.push(`\n\n--- Não foi possível extrair texto do PDF: ${errorDetail}. Tente usar um PDF com texto selecionável ou descreva o conteúdo do PDF em texto. ---`);
                    }
                  }
                } else {
                  // Python process failed
                  console.error(`[Chat] Erro ao processar PDF:`, result.error || 'Erro desconhecido');
                  const errorMsg = result.error || 'Erro desconhecido ao processar PDF';
                  pdfTexts.push(`\n\n--- Erro ao processar PDF: ${errorMsg}. Verifique se o arquivo está íntegro e se as bibliotecas Python estão instaladas (pip install PyPDF2 pdf2image). ---`);
                }
              } catch (error) {
                console.error(`[Chat] Exceção ao extrair texto do PDF:`, error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                pdfTexts.push(`\n\n--- Erro ao processar PDF: ${errorMessage} ---`);
              } finally {
                // Don't cleanup immediately - Python might still be using the file
                // The cleanup will happen later or on next server restart
                // This prevents ENOENT errors when Python is still reading the file
              }
            }
          }
          
          // Build multimodal message content
          const contentParts: Array<{ type: "text" } | { type: "image_url" } | { type: "file_url" }> = [];
          
          // Detect if user is asking for news
          const userMessage = input.message || "";
          const newsDetection = detectNewsRequest(userMessage);
          let newsContext = "";
          
          if (newsDetection.isNewsRequest) {
            console.log(`[Chat] Solicitação de notícias detectada: tipo=${newsDetection.queryType}, query=${newsDetection.query || 'N/A'}`);
            const fetchedNews = await fetchRelevantNews(newsDetection);
            if (fetchedNews) {
              newsContext = fetchedNews;
              console.log(`[Chat] Notícias encontradas e adicionadas ao contexto`);
            } else {
              console.log(`[Chat] Nenhuma notícia disponível ou erro ao buscar`);
            }
          }
          
          // Detect if user is asking for stock information
          const stockDetection = detectStockRequest(userMessage);
          let stockContext = "";
          
          if (stockDetection.isStockRequest) {
            console.log(`[Chat] Solicitação de ações detectada: ticker=${stockDetection.ticker || 'N/A'}, period=${stockDetection.period || 'N/A'}, action=${stockDetection.action || 'N/A'}`);
            const fetchedStock = await fetchStockData(stockDetection);
            if (fetchedStock) {
              stockContext = fetchedStock;
              console.log(`[Chat] Dados de ações encontrados e adicionados ao contexto`);
            } else {
              console.log(`[Chat] Nenhum dado de ações disponível ou erro ao buscar`);
            }
          }
          
          // Detect if user is asking for financial calculations
          const calculationDetection = detectCalculationRequest(userMessage);
          let calculationContext = "";
          
          if (calculationDetection.isCalculationRequest) {
            console.log(`[Chat] Solicitação de cálculo detectada: type=${calculationDetection.calculationType || 'N/A'}`);
            const calculated = await processFinancialCalculations(userMessage);
            if (calculated) {
              calculationContext = calculated;
              console.log(`[Chat] Cálculos realizados e adicionados ao contexto`);
            } else {
              console.log(`[Chat] Não foi possível processar cálculos ou informações insuficientes`);
            }
          }
          
          // Combine original message with extracted PDF texts, news context, stock context, and calculation context
          let combinedText = userMessage;
          if (pdfTexts.length > 0) {
            combinedText += pdfTexts.join("\n");
          }
          if (newsContext) {
            combinedText = newsContext + "\n\n" + combinedText;
          }
          if (stockContext) {
            combinedText = stockContext + "\n\n" + combinedText;
          }
          if (calculationContext) {
            combinedText = calculationContext + "\n\n" + combinedText;
          }
          
          // Add text if provided (now including PDF content)
          if (combinedText.trim()) {
            contentParts.push({
              type: "text",
              text: combinedText.trim(),
            });
          }
          
          // Add images if provided
          if (input.images && input.images.length > 0) {
            input.images.forEach((imageUrl) => {
              contentParts.push({
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              });
            });
          }
          
          // Add audio if provided
          if (input.audio) {
            // Determine mime type from URL or data URL
            let audioMimeType = 'audio/mpeg'; // default
            if (input.audio.startsWith('data:')) {
              // Extract mime type from data URL: data:audio/mpeg;base64,...
              const match = input.audio.match(/^data:([^;]+)/);
              if (match && match[1]) {
                audioMimeType = match[1];
              }
            } else {
              // Determine from file extension
              audioMimeType = input.audio.includes('.mp3') ? 'audio/mpeg' :
                             input.audio.includes('.wav') ? 'audio/wav' :
                             input.audio.includes('.m4a') ? 'audio/mp4' :
                             input.audio.includes('.webm') ? 'audio/webm' :
                             input.audio.includes('.ogg') ? 'audio/ogg' :
                             'audio/mpeg';
            }
            
            contentParts.push({
              type: "file_url",
              file_url: {
                url: input.audio,
                mime_type: audioMimeType as "audio/mpeg" | "audio/wav" | "audio/mp4" | "audio/webm" | "audio/ogg",
              },
            });
          }
          
          // If no content at all, return error
          if (contentParts.length === 0 && !input.pdfs?.length) {
            return {
              success: false,
              content: "Por favor, envie uma mensagem de texto, imagem, áudio ou PDF.",
            };
          }
          
          // If only PDFs were sent and text extraction failed, inform user
          if (input.pdfs && input.pdfs.length > 0 && contentParts.length === 0) {
            return {
              success: false,
              content: "Não foi possível extrair texto dos PDFs enviados. Tente novamente ou envie junto com uma mensagem de texto.",
            };
          }
          
          // Determine if we should use Groq or invokeLLM
          const hasAudio = contentParts.some(part => part.type === "file_url");
          const groqApiKey = process.env.GROQ_API_KEY;
          
          // Prefer Groq for text and images (Groq supports images but audio support is limited)
          // Use invokeLLM for audio or when Groq is not available
          // Only use Groq if there's no audio and Groq is configured
          if (groqApiKey && !hasAudio) {
            // Use Groq (preferred for text and images)
            try {
              // Build user content for Groq
              // Process images - save to temp files if needed to avoid ENAMETOOLONG
              const processedContentParts = await Promise.all(
                contentParts.map(async (part) => {
                  if (part.type === "text") {
                    return { type: "text", text: part.text };
                  } else if (part.type === "image_url") {
                    // Save image to temp file if it's a data URL or very long
                    const { path: imagePath, cleanup } = await processFileForPython(part.image_url.url, 'jpg');
                    tempFileCleanups.push(cleanup);
                    return { type: "image_url", image_url: { url: imagePath } };
                  }
                  // Skip audio for Groq
                  return null;
                })
              );
              
              const userContentForGroq = processedContentParts.length === 1 && processedContentParts[0]?.type === "text"
                ? processedContentParts[0].text
                : processedContentParts.length > 1 || processedContentParts.some(p => p && p.type !== "text")
                ? processedContentParts.filter(Boolean)
                : processedContentParts[0]?.text || "";
              
              // Prepare conversation history for Groq
              const groqHistory = input.conversationHistory?.map(msg => {
                // Convert multimodal history to Groq format
                if (typeof msg.content === "string") {
                  return { role: msg.role, content: msg.content };
                }
                // For multimodal content, try to preserve structure
                return { role: msg.role, content: msg.content };
              });
              
              // Call Groq multimodal assistant
              const response = await groqService.financialAssistantMultimodal(
                userContentForGroq,
                groqHistory
              );
              
              // Schedule cleanup after a delay to ensure Python has finished
              setTimeout(async () => {
                await Promise.all(tempFileCleanups.map(cleanup => cleanup().catch(() => {})));
              }, 5000); // Wait 5 seconds to ensure Python processes are done
              
              return {
                success: true,
                content: response,
              };
            } catch (groqError) {
              // Schedule cleanup even on error
              setTimeout(async () => {
                await Promise.all(tempFileCleanups.map(cleanup => cleanup().catch(() => {})));
              }, 5000);
              console.error("[Chat] Erro ao usar Groq, tentando fallback:", groqError);
              // Fall through to invokeLLM if Groq fails
            }
          }
          
          // Use invokeLLM for audio or as fallback when Groq is not available
          // Check if Forge API is configured (required for audio or when Groq is not available)
          if (!ENV.forgeApiKey) {
            // If we reach here, Groq either failed or is not configured
            if (hasAudio) {
              return {
                success: false,
                content: "Áudio requer configuração do serviço Forge (BUILT_IN_FORGE_API_KEY). Para texto e imagens, configure GROQ_API_KEY no arquivo .env",
              };
            }
            // Groq should have been used, but if we're here, it failed or wasn't configured
            return {
              success: false,
              content: "Erro ao processar mensagem. Verifique se GROQ_API_KEY está configurada no arquivo .env, ou configure BUILT_IN_FORGE_API_KEY para usar o serviço Forge.",
            };
          }
          
          // Build messages array for invokeLLM
          const messages: Message[] = [
            {
              role: "system",
              content: "Você é o Bolsinho, assistente financeiro pessoal e especialista em investimentos e finanças. Você é especializado em: análise de ações e mercado de capitais (B3, NYSE, NASDAQ), monitoramento de cotações e variações de ações, análise de performance e histórico de ações, educação financeira, planejamento de orçamento, análise de gastos, investimentos e mercado financeiro, e economia. Seja sempre prestativo, claro e forneça conselhos práticos. Use linguagem acessível e exemplos quando apropriado. Quando falar sobre investimentos ou ações, sempre mencione os riscos envolvidos. Você pode analisar dados de ações fornecidos no contexto e explicar variações, tendências e performance. IMPORTANTE: Se houver CÁLCULOS PRECISOS no contexto da mensagem (marcados com 'CALCULADO PRECISAMENTE'), SEMPRE use esses valores calculados. NUNCA invente números ou faça cálculos você mesmo. Apresente os resultados EXATAMENTE como estão calculados no contexto.",
            },
          ];
          
          // Add conversation history if provided
          if (input.conversationHistory) {
            input.conversationHistory.forEach((msg) => {
              if (msg.role !== "system") {
                messages.push({
                  role: msg.role,
                  content: msg.content as any,
                });
              }
            });
          }
          
          // Add current user message
          // Convert contentParts to the format expected by MessageContent
          const userMessageContent: Message["content"] = contentParts.length === 1 && contentParts[0].type === "text"
            ? contentParts[0].text
            : contentParts as Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } } | { type: "file_url"; file_url: { url: string; mime_type?: string } }>;
          
          messages.push({
            role: "user",
            content: userMessageContent,
          });
          
          // Call multimodal LLM
          const result = await invokeLLM({
            messages,
            max_tokens: 32768,
          });
          
          // Extract response content
          const responseContent = result.choices[0]?.message?.content;
          
          if (!responseContent) {
            return {
              success: false,
              content: "Desculpe, não recebi uma resposta do modelo.",
            };
          }
          
          // Handle both string and array responses
          const responseText = typeof responseContent === "string"
            ? responseContent
            : Array.isArray(responseContent)
            ? responseContent
                .filter((part: any) => part.type === "text")
                .map((part: any) => part.text)
                .join("\n")
            : String(responseContent);
          
          return {
            success: true,
            content: responseText,
          };
        } catch (error) {
          console.error("[Chat] Erro ao processar mensagem:", error);
          return {
            success: false,
            content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
            error: error instanceof Error ? error.message : "Erro desconhecido",
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
