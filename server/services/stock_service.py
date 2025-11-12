#!/usr/bin/env python3
"""
Serviço para buscar dados de ações da bolsa de valores usando yfinance.
Suporta ações brasileiras (B3) e internacionais.
"""

import os
import yfinance as yf
import pandas as pd
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json
import time


class StockService:
    """Serviço para busca de dados de ações."""
    
    def __init__(self):
        """Inicializa o serviço de ações."""
        # yfinance não requer API key, é gratuito
        pass
    
    def _normalize_ticker(self, ticker: str) -> str:
        """
        Normaliza o ticker para o formato do Yahoo Finance.
        
        Ações brasileiras no Yahoo Finance terminam com .SA (ex: PETR4.SA, VALE3.SA)
        Ações americanas não precisam de sufixo (ex: AAPL, MSFT)
        """
        ticker = ticker.upper().strip()
        
        # Se já tem .SA, retorna como está
        if ticker.endswith('.SA'):
            return ticker
        
        # Se não tem sufixo e parece ser ação brasileira (número no final), adiciona .SA
        # Ações brasileiras geralmente têm formato: LETRA+NÚMERO (ex: PETR4, VALE3, ITUB4)
        if ticker and ticker[-1].isdigit():
            # Verifica se é ação brasileira comum
            brazilian_tickers = ['PETR', 'VALE', 'ITUB', 'BBDC', 'ABEV', 'WEGE', 'RENT', 
                               'SUZB', 'RADL', 'ELET', 'ELET3', 'ELET6', 'BBAS', 'SANB',
                               'CMIG', 'EMBR', 'HAPV', 'VIVT', 'KLBN', 'UGPA', 'CCRO',
                               'CYRE', 'EGIE', 'FLRY', 'GGBR', 'GOAU', 'HYPE', 'JBSS',
                               'LREN', 'MULT', 'PCAR', 'QUAL', 'RAIL', 'SBSP', 'SMLE',
                               'TIMP', 'USIM', 'VALE3', 'VIVT3']
            
            # Se começa com um dos prefixos conhecidos ou tem formato brasileiro, adiciona .SA
            if any(ticker.startswith(prefix) for prefix in brazilian_tickers) or len(ticker) <= 6:
                return f"{ticker}.SA"
        
        return ticker
    
    def get_stock_info(self, ticker: str) -> Dict[str, Any]:
        """
        Busca informações básicas de uma ação.
        
        Args:
            ticker: Código da ação (ex: PETR4, PETR4.SA, AAPL)
        
        Returns:
            Dict com informações da ação
        """
        try:
            normalized_ticker = self._normalize_ticker(ticker)
            stock = yf.Ticker(normalized_ticker)
            
            # Tenta buscar info, mas pode falhar por rate limit
            try:
                info = stock.info
            except Exception as e:
                # Se info falhar, tenta apenas com history
                info = {}
                error_msg = str(e)
                if "429" in error_msg or "Too Many Requests" in error_msg:
                    return {
                        "success": False,
                        "error": f"Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                        "ticker": ticker,
                        "normalized_ticker": normalized_ticker,
                        "rate_limited": True
                    }
            
            # Busca dados históricos recentes
            # Tenta múltiplas estratégias para obter dados
            import time
            hist = None
            
            # Estratégia 1: Tenta com diferentes períodos usando history()
            periods_to_try = ["1d", "5d", "1mo", "3mo", "6mo", "1y"]
            for period in periods_to_try:
                try:
                    hist = stock.history(period=period, timeout=30, raise_errors=True)
                    if hist is not None and not hist.empty and len(hist) > 0:
                        break
                    time.sleep(1)  # Pequeno delay entre tentativas
                except Exception as e:
                    error_msg = str(e).lower()
                    if "429" in error_msg or "too many requests" in error_msg or "rate limit" in error_msg:
                        return {
                            "success": False,
                            "error": f"Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                            "ticker": ticker,
                            "normalized_ticker": normalized_ticker,
                            "rate_limited": True
                        }
                    # Continua tentando próximo período
                    continue
            
            # Estratégia 2: Se history() falhou, tenta usar download() com intervalo de datas
            if hist is None or hist.empty:
                try:
                    from datetime import datetime, timedelta
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=30)
                    
                    # Tenta download com intervalo específico
                    hist = yf.download(
                        normalized_ticker,
                        start=start_date.strftime("%Y-%m-%d"),
                        end=end_date.strftime("%Y-%m-%d"),
                        progress=False,
                        timeout=30
                    )
                    
                    # Se retornar múltiplas colunas (MultiIndex), pega a primeira
                    if isinstance(hist.columns, pd.MultiIndex):
                        hist = hist.iloc[:, 0:6]  # Pega as primeiras 6 colunas
                        hist.columns = ['Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume']
                    
                except Exception as e:
                    error_msg = str(e).lower()
                    if "429" in error_msg or "too many requests" in error_msg:
                        return {
                            "success": False,
                            "error": f"Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                            "ticker": ticker,
                            "normalized_ticker": normalized_ticker,
                            "rate_limited": True
                        }
                    # Se download também falhar, continua
                    pass
            
            # Estratégia 3: Tenta buscar apenas o último dia útil
            if hist is None or hist.empty:
                try:
                    from datetime import datetime, timedelta
                    # Tenta apenas os últimos 5 dias úteis
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=7)  # 7 dias para garantir dias úteis
                    
                    hist = stock.history(start=start_date, end=end_date, timeout=30)
                    
                except Exception as e:
                    error_msg = str(e).lower()
                    if "429" in error_msg or "too many requests" in error_msg:
                        return {
                            "success": False,
                            "error": f"Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                            "ticker": ticker,
                            "normalized_ticker": normalized_ticker,
                            "rate_limited": True
                        }
            
            # Se ainda não conseguiu dados, retorna erro
            if hist is None or hist.empty or len(hist) == 0:
                return {
                    "success": False,
                    "error": f"Ação {ticker} não encontrada ou dados indisponíveis no Yahoo Finance. O ticker pode estar incorreto ou a ação pode estar temporariamente indisponível.",
                    "ticker": ticker,
                    "normalized_ticker": normalized_ticker
                }
            
            # Preço atual (último fechamento)
            current_price = float(hist['Close'].iloc[-1]) if not hist.empty else None
            previous_close = float(hist['Close'].iloc[-2]) if len(hist) > 1 else current_price
            
            # Variação
            change = current_price - previous_close if previous_close else 0
            change_percent = (change / previous_close * 100) if previous_close else 0
            
            # Dados do dia
            latest = hist.iloc[-1]
            day_high = float(latest['High']) if 'High' in latest else None
            day_low = float(latest['Low']) if 'Low' in latest else None
            volume = int(latest['Volume']) if 'Volume' in latest else None
            
            result = {
                "success": True,
                "ticker": ticker,
                "normalized_ticker": normalized_ticker,
                "symbol": info.get("symbol", normalized_ticker),
                "name": info.get("longName") or info.get("shortName") or ticker,
                "current_price": round(current_price, 2) if current_price else None,
                "previous_close": round(previous_close, 2) if previous_close else None,
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "day_high": round(day_high, 2) if day_high else None,
                "day_low": round(day_low, 2) if day_low else None,
                "volume": volume,
                "currency": info.get("currency", "BRL" if ".SA" in normalized_ticker else "USD"),
                "market": "B3" if ".SA" in normalized_ticker else "NYSE/NASDAQ",
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "market_cap": info.get("marketCap"),
                "timestamp": datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            error_msg = str(e)
            # Detecta rate limiting
            if "429" in error_msg or "Too Many Requests" in error_msg:
                return {
                    "success": False,
                    "error": f"Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                    "ticker": ticker,
                    "rate_limited": True
                }
            return {
                "success": False,
                "error": f"Erro ao buscar dados da ação {ticker}: {error_msg}",
                "ticker": ticker
            }
    
    def get_stock_history(self, ticker: str, period: str = "1mo", interval: str = "1d") -> Dict[str, Any]:
        """
        Busca histórico de preços de uma ação.
        
        Args:
            ticker: Código da ação
            period: Período (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
            interval: Intervalo (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
        
        Returns:
            Dict com histórico de preços
        """
        try:
            normalized_ticker = self._normalize_ticker(ticker)
            stock = yf.Ticker(normalized_ticker)
            
            try:
                hist = stock.history(period=period, interval=interval)
            except Exception as e:
                error_msg = str(e)
                if "429" in error_msg or "Too Many Requests" in error_msg:
                    return {
                        "success": False,
                        "error": f"Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                        "ticker": ticker,
                        "rate_limited": True
                    }
                raise  # Re-raise se não for rate limit
            
            if hist.empty:
                return {
                    "success": False,
                    "error": f"Histórico não disponível para {ticker}",
                    "ticker": ticker
                }
            
            # Converte para formato JSON serializable
            history_data = []
            for date, row in hist.iterrows():
                history_data.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "open": round(float(row['Open']), 2),
                    "high": round(float(row['High']), 2),
                    "low": round(float(row['Low']), 2),
                    "close": round(float(row['Close']), 2),
                    "volume": int(row['Volume']) if 'Volume' in row else None,
                    "adj_close": round(float(row['Adj Close']), 2) if 'Adj Close' in row else None
                })
            
            # Calcula variação no período
            first_close = history_data[0]['close'] if history_data else None
            last_close = history_data[-1]['close'] if history_data else None
            period_change = last_close - first_close if (first_close and last_close) else 0
            period_change_percent = (period_change / first_close * 100) if first_close else 0
            
            # Estatísticas
            prices = [d['close'] for d in history_data]
            high_price = max(prices) if prices else None
            low_price = min(prices) if prices else None
            avg_price = sum(prices) / len(prices) if prices else None
            
            # Get currency from stock info
            stock_info = stock.info
            currency = stock_info.get("currency", "BRL" if ".SA" in normalized_ticker else "USD")
            
            return {
                "success": True,
                "ticker": ticker,
                "normalized_ticker": normalized_ticker,
                "period": period,
                "interval": interval,
                "data_points": len(history_data),
                "first_date": history_data[0]['date'] if history_data else None,
                "last_date": history_data[-1]['date'] if history_data else None,
                "first_close": round(first_close, 2) if first_close else None,
                "last_close": round(last_close, 2) if last_close else None,
                "period_change": round(period_change, 2),
                "period_change_percent": round(period_change_percent, 2),
                "high_price": round(high_price, 2) if high_price else None,
                "low_price": round(low_price, 2) if low_price else None,
                "avg_price": round(avg_price, 2) if avg_price else None,
                "history": history_data,
                "currency": currency,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            error_msg = str(e)
            # Detecta rate limiting
            if "429" in error_msg or "Too Many Requests" in error_msg:
                return {
                    "success": False,
                    "error": f"Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                    "ticker": ticker,
                    "rate_limited": True
                }
            return {
                "success": False,
                "error": f"Erro ao buscar histórico da ação {ticker}: {error_msg}",
                "ticker": ticker
            }
    
    def get_stock_variation(self, ticker: str, period: str = "1mo") -> Dict[str, Any]:
        """
        Busca variação de uma ação em um período específico.
        Método simplificado que retorna apenas a variação.
        
        Args:
            ticker: Código da ação
            period: Período (1d, 5d, 1mo, 3mo, 6mo, 1y)
        
        Returns:
            Dict com variação da ação
        """
        try:
            normalized_ticker = self._normalize_ticker(ticker)
            stock = yf.Ticker(normalized_ticker)
            hist = stock.history(period=period)
            
            if hist.empty:
                return {
                    "success": False,
                    "error": f"Dados não disponíveis para {ticker}",
                    "ticker": ticker
                }
            
            first_close = float(hist['Close'].iloc[0])
            last_close = float(hist['Close'].iloc[-1])
            change = last_close - first_close
            change_percent = (change / first_close) * 100
            
            # Busca info básica
            info = stock.info
            name = info.get("longName") or info.get("shortName") or ticker
            
            return {
                "success": True,
                "ticker": ticker,
                "normalized_ticker": normalized_ticker,
                "name": name,
                "period": period,
                "start_price": round(first_close, 2),
                "end_price": round(last_close, 2),
                "change": round(change, 2),
                "change_percent": round(change_percent, 2),
                "currency": info.get("currency", "BRL" if ".SA" in normalized_ticker else "USD"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao calcular variação da ação {ticker}: {str(e)}",
                "ticker": ticker
            }
    
    def search_stocks(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Busca ações por nome ou símbolo.
        Nota: yfinance não tem busca direta, então retorna sugestões baseadas em tickers conhecidos.
        
        Args:
            query: Termo de busca
            limit: Número máximo de resultados
        
        Returns:
            Dict com sugestões de ações
        """
        # Lista de ações brasileiras populares
        brazilian_stocks = {
            "PETR4": "Petrobras",
            "VALE3": "Vale",
            "ITUB4": "Itaú Unibanco",
            "BBDC4": "Bradesco",
            "ABEV3": "Ambev",
            "WEGE3": "Weg",
            "RENT3": "Localiza",
            "SUZB3": "Suzano",
            "RADL3": "Raia Drogasil",
            "ELET3": "Eletrobras",
            "BBAS3": "Banco do Brasil",
            "SANB11": "Santander",
            "CMIG4": "Cemig",
            "EMBR3": "Embraer",
            "VIVT3": "Telefônica Brasil",
            "KLBN11": "Klabin",
            "UGPA3": "Ultrapar",
            "CCRO3": "CCR",
            "CYRE3": "Cyrela",
            "EGIE3": "Engie Brasil",
            "FLRY3": "Fleury",
            "GGBR4": "Gerdau",
            "HYPE3": "Hypera",
            "JBSS3": "JBS",
            "LREN3": "Lojas Renner",
            "MULT3": "Multiplan",
            "PCAR3": "Companhia Brasileira de Distribuição",
            "QUAL3": "Qualicorp",
            "RAIL3": "Rumo",
            "SBSP3": "Sabesp",
            "USIM5": "Usinas Siderúrgicas",
        }
        
        query_upper = query.upper().strip()
        results = []
        
        # Busca exata
        if query_upper in brazilian_stocks:
            results.append({
                "ticker": query_upper,
                "name": brazilian_stocks[query_upper],
                "market": "B3"
            })
        
        # Busca parcial
        for ticker, name in brazilian_stocks.items():
            if query_upper in ticker or query_upper in name.upper():
                if ticker not in [r["ticker"] for r in results]:
                    results.append({
                        "ticker": ticker,
                        "name": name,
                        "market": "B3"
                    })
                    if len(results) >= limit:
                        break
        
        return {
            "success": True,
            "query": query,
            "results": results,
            "count": len(results)
        }


# Instância global do serviço
_stock_service: Optional[StockService] = None


def get_stock_service() -> StockService:
    """Retorna a instância do serviço de ações (lazy initialization)."""
    global _stock_service
    if _stock_service is None:
        _stock_service = StockService()
    return _stock_service


if __name__ == "__main__":
    import sys
    import json
    
    if len(sys.argv) < 2:
        print("Uso: python stock_service.py <método> [args...]")
        print("Métodos: get_stock_info, get_stock_history, get_stock_variation, search_stocks")
        sys.exit(1)
    
    method = sys.argv[1]
    service = get_stock_service()
    
    try:
        if method == "get_stock_info":
            if len(sys.argv) < 3:
                print("Uso: python stock_service.py get_stock_info <ticker>")
                sys.exit(1)
            ticker = sys.argv[2]
            result = service.get_stock_info(ticker)
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        elif method == "get_stock_history":
            if len(sys.argv) < 3:
                print("Uso: python stock_service.py get_stock_history <ticker> [period] [interval]")
                sys.exit(1)
            ticker = sys.argv[2]
            period = sys.argv[3] if len(sys.argv) > 3 else "1mo"
            interval = sys.argv[4] if len(sys.argv) > 4 else "1d"
            result = service.get_stock_history(ticker, period, interval)
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        elif method == "get_stock_variation":
            if len(sys.argv) < 3:
                print("Uso: python stock_service.py get_stock_variation <ticker> [period]")
                sys.exit(1)
            ticker = sys.argv[2]
            period = sys.argv[3] if len(sys.argv) > 3 else "1mo"
            result = service.get_stock_variation(ticker, period)
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        elif method == "search_stocks":
            if len(sys.argv) < 3:
                print("Uso: python stock_service.py search_stocks <query>")
                sys.exit(1)
            query = sys.argv[2]
            result = service.search_stocks(query)
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        else:
            print(f"Método desconhecido: {method}")
            sys.exit(1)
    
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2, ensure_ascii=False))
        sys.exit(1)

