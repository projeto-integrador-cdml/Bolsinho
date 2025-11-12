#!/usr/bin/env python3
"""CLI wrapper para calculator_service"""

import sys
import json
import io

# Configurar encoding UTF-8 para stdout/stderr
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from calculator_service import get_calculator_service

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
    
    try:
        request = json.loads(sys.argv[1])
        method = request.get("method")
        args = request.get("args", [])
        
        service = get_calculator_service()
        
        if method == "calculate_investment_distribution":
            total = args[0]
            percentages = args[1] if len(args) > 1 else None
            amounts = args[2] if len(args) > 2 else None
            targets = args[3] if len(args) > 3 else None
            result = service.calculate_investment_distribution(total, percentages, amounts, targets)
            print(json.dumps(result, ensure_ascii=False))
        
        elif method == "calculate_percentage":
            value = args[0]
            total = args[1]
            result = service.calculate_percentage(value, total)
            print(json.dumps(result, ensure_ascii=False))
        
        elif method == "calculate_compound_interest":
            principal = args[0]
            rate = args[1]
            time = args[2]
            frequency = args[3] if len(args) > 3 else 12
            result = service.calculate_compound_interest(principal, rate, time, frequency)
            print(json.dumps(result, ensure_ascii=False))
        
        elif method == "parse_financial_question":
            question = args[0]
            result = service.parse_financial_question(question)
            print(json.dumps(result, ensure_ascii=False))
        
        elif method == "safe_eval":
            expression = args[0]
            result = service.safe_eval(expression)
            print(json.dumps({"result": result}, ensure_ascii=False))
        
        else:
            print(json.dumps({"error": f"Unknown method: {method}"}))
            sys.exit(1)
    
    except Exception as e:
        import traceback
        error_msg = f"Erro ao executar cálculo: {str(e)}"
        print(json.dumps({"error": error_msg, "details": traceback.format_exc()}, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()

