#!/usr/bin/env python3
"""CLI wrapper para stock_service"""

import sys
import json
import io

# Configurar encoding UTF-8 para stdout/stderr
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from stock_service import get_stock_service

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
    
    try:
        request = json.loads(sys.argv[1])
        method = request.get("method")
        args = request.get("args", [])
        
        service = get_stock_service()
        
        if method == "get_stock_info":
            ticker = args[0]
            result = service.get_stock_info(ticker)
            
        elif method == "get_stock_history":
            ticker = args[0]
            period = args[1] if len(args) > 1 else "1mo"
            interval = args[2] if len(args) > 2 else "1d"
            result = service.get_stock_history(ticker, period, interval)
            
        elif method == "get_stock_variation":
            ticker = args[0]
            period = args[1] if len(args) > 1 else "1mo"
            result = service.get_stock_variation(ticker, period)
            
        elif method == "search_stocks":
            query = args[0]
            limit = args[1] if len(args) > 1 else 5
            result = service.search_stocks(query, limit)
            
        else:
            result = {"error": f"Unknown method: {method}"}
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        # Se for rate limit, retorna JSON com success: false
        if "429" in error_msg or "Too Many Requests" in error_msg:
            error_result = {
                "success": False,
                "error": "Limite de requisições excedido. Aguarde alguns segundos e tente novamente.",
                "rate_limited": True
            }
        else:
            error_result = {
                "success": False,
                "error": f"Erro ao buscar dados de ações: {error_msg}",
                "details": traceback.format_exc()
            }
        print(json.dumps(error_result, ensure_ascii=False))
        # Não faz sys.exit(1) para que o JSON seja retornado
        # O código de saída 0 indica sucesso na execução do script, mesmo com erro no resultado

if __name__ == "__main__":
    main()

