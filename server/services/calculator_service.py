#!/usr/bin/env python3
"""
Serviço para cálculos financeiros precisos.
Usa Python para fazer cálculos matemáticos reais, não confia na IA para cálculos.
"""

import re
import json
from typing import Dict, Any, List, Optional
from decimal import Decimal, getcontext


# Configurar precisão decimal para cálculos financeiros
getcontext().prec = 28


class CalculatorService:
    """Serviço para cálculos financeiros precisos."""
    
    def __init__(self):
        """Inicializa o serviço de cálculos."""
        pass
    
    def safe_eval(self, expression: str) -> Optional[float]:
        """
        Avalia uma expressão matemática de forma segura.
        
        Args:
            expression: Expressão matemática (ex: "1000 + 500 + 500")
        
        Returns:
            Resultado do cálculo ou None se houver erro
        """
        try:
            # Remove espaços e normaliza
            expression = expression.strip()
            
            # Substitui vírgulas por pontos (formato brasileiro)
            expression = expression.replace(',', '.')
            
            # Remove caracteres não matemáticos (exceto números, operadores, parênteses, ponto)
            # Permite: números, +, -, *, /, (, ), ., espaço
            safe_chars = re.sub(r'[^0-9+\-*/().\s]', '', expression)
            
            # Avalia apenas expressões matemáticas seguras
            if not re.match(r'^[0-9+\-*/().\s]+$', safe_chars):
                return None
            
            # Avalia a expressão
            result = eval(safe_chars, {"__builtins__": {}})
            
            # Converte para float e retorna
            return float(result)
        except Exception as e:
            return None
    
    def calculate_investment_distribution(
        self,
        total_amount: float,
        percentages: List[float] = None,
        amounts: List[float] = None,
        targets: List[str] = None
    ) -> Dict[str, Any]:
        """
        Distribui um valor total entre múltiplos investimentos.
        
        Args:
            total_amount: Valor total a ser investido
            percentages: Lista de percentuais (ex: [50, 30, 20])
            amounts: Lista de valores específicos (ex: [1000, 500, 500])
            targets: Lista de nomes dos investimentos (ex: ["Ações", "Fundos", "Tesouro"])
        
        Returns:
            Dict com a distribuição calculada
        """
        try:
            total = Decimal(str(total_amount))
            results = []
            used_amount = Decimal('0')
            
            if percentages and len(percentages) > 0:
                # Distribuição por percentuais
                if abs(sum(percentages) - 100) > 0.01:
                    return {
                        "success": False,
                        "error": f"Os percentuais somam {sum(percentages)}%, mas devem somar 100%"
                    }
                
                for i, percentage in enumerate(percentages):
                    target_name = targets[i] if targets and i < len(targets) else f"Investimento {i+1}"
                    amount = (total * Decimal(str(percentage)) / Decimal('100')).quantize(Decimal('0.01'))
                    used_amount += amount
                    
                    results.append({
                        "target": target_name,
                        "percentage": float(percentage),
                        "amount": float(amount),
                        "formatted_amount": f"R$ {amount:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                    })
                
                # Ajuste de arredondamento (pode haver diferença de centavos)
                difference = total - used_amount
                if abs(difference) > Decimal('0.01'):
                    # Ajusta o último item
                    if results:
                        results[-1]["amount"] = float(Decimal(str(results[-1]["amount"])) + difference)
                        results[-1]["formatted_amount"] = f"R$ {results[-1]['amount']:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            
            elif amounts and len(amounts) > 0:
                # Distribuição por valores específicos
                total_specified = sum(Decimal(str(amt)) for amt in amounts)
                
                if total_specified > total:
                    return {
                        "success": False,
                        "error": f"Os valores especificados somam R$ {total_specified:,.2f}, mas o total disponível é R$ {total:,.2f}"
                    }
                
                for i, amount in enumerate(amounts):
                    target_name = targets[i] if targets and i < len(targets) else f"Investimento {i+1}"
                    amount_decimal = Decimal(str(amount))
                    percentage = (amount_decimal / total * Decimal('100')).quantize(Decimal('0.01'))
                    used_amount += amount_decimal
                    
                    results.append({
                        "target": target_name,
                        "percentage": float(percentage),
                        "amount": float(amount_decimal),
                        "formatted_amount": f"R$ {amount_decimal:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                    })
                
                # Se sobrar valor, adiciona como "Restante" ou distribui proporcionalmente
                remaining = total - used_amount
                if remaining > Decimal('0.01'):
                    # Distribui o restante proporcionalmente
                    if results:
                        proportion = remaining / len(results)
                        for result in results:
                            result["amount"] = float(Decimal(str(result["amount"])) + proportion)
                            result["formatted_amount"] = f"R$ {result['amount']:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
                        # Recalcula percentuais
                        for result in results:
                            result["percentage"] = float(Decimal(str(result["amount"])) / total * Decimal('100')).quantize(Decimal('0.01'))
            
            else:
                return {
                    "success": False,
                    "error": "É necessário fornecer percentuais ou valores específicos"
                }
            
            # Verifica se a soma está correta
            calculated_total = sum(Decimal(str(r["amount"])) for r in results)
            is_correct = abs(calculated_total - total) < Decimal('0.01')
            
            return {
                "success": True,
                "total_amount": float(total),
                "formatted_total": f"R$ {total:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
                "distribution": results,
                "calculated_total": float(calculated_total),
                "difference": float(total - calculated_total),
                "is_correct": is_correct,
                "summary": f"Total: R$ {total:,.2f} | Calculado: R$ {calculated_total:,.2f} | Diferença: R$ {abs(total - calculated_total):,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao calcular distribuição: {str(e)}"
            }
    
    def calculate_percentage(self, value: float, total: float) -> Dict[str, Any]:
        """
        Calcula o percentual de um valor em relação a um total.
        
        Args:
            value: Valor
            total: Total
        
        Returns:
            Percentual calculado
        """
        try:
            if total == 0:
                return {
                    "success": False,
                    "error": "O total não pode ser zero"
                }
            
            percentage = (Decimal(str(value)) / Decimal(str(total)) * Decimal('100')).quantize(Decimal('0.01'))
            
            return {
                "success": True,
                "value": float(value),
                "total": float(total),
                "percentage": float(percentage),
                "formatted": f"{percentage}%"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao calcular percentual: {str(e)}"
            }
    
    def calculate_compound_interest(
        self,
        principal: float,
        rate: float,
        time: float,
        compounding_frequency: int = 12
    ) -> Dict[str, Any]:
        """
        Calcula juros compostos.
        
        Args:
            principal: Valor principal
            rate: Taxa de juros anual (em percentual, ex: 10 para 10%)
            time: Tempo em anos
            compounding_frequency: Frequência de capitalização (12 = mensal, 1 = anual)
        
        Returns:
            Valor futuro e detalhes do cálculo
        """
        try:
            principal_dec = Decimal(str(principal))
            rate_dec = Decimal(str(rate)) / Decimal('100')  # Converte percentual para decimal
            time_dec = Decimal(str(time))
            n = Decimal(str(compounding_frequency))
            
            # Fórmula: A = P(1 + r/n)^(nt)
            amount = principal_dec * (Decimal('1') + rate_dec / n) ** (n * time_dec)
            interest = amount - principal_dec
            
            return {
                "success": True,
                "principal": float(principal_dec),
                "rate": float(rate),
                "time_years": float(time_dec),
                "compounding_frequency": int(compounding_frequency),
                "future_value": float(amount),
                "interest_earned": float(interest),
                "formatted_principal": f"R$ {principal_dec:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
                "formatted_future_value": f"R$ {amount:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'),
                "formatted_interest": f"R$ {interest:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.')
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao calcular juros compostos: {str(e)}"
            }
    
    def parse_financial_question(self, question: str) -> Dict[str, Any]:
        """
        Tenta extrair informações financeiras de uma pergunta em português.
        
        Args:
            question: Pergunta do usuário
        
        Returns:
            Informações extraídas (total, percentuais, valores, etc.)
        """
        question_lower = question.lower()
        extracted = {
            "total_amount": None,
            "percentages": [],
            "amounts": [],
            "targets": [],
            "calculation_type": None
        }
        
        # Extrai valor total - padrões mais abrangentes
        # Padrões: "2 mil", "2000 reais", "R$ 2000", "2000,00", "investir 2 mil"
        total_patterns = [
            r'investir\s+(\d+(?:[.,]\d+)?)\s*(?:mil|milh[oõ]es?|reais?|r\$)?',
            r'(\d+(?:[.,]\d+)?)\s*(?:mil|milh[oõ]es?)\s*(?:reais?|r\$)?',
            r'(\d+(?:[.,]\d+)?)\s*(?:reais?|r\$)\s*(?:ao\s+)?total',
            r'total\s+(?:de\s+)?(\d+(?:[.,]\d+)?)',
            r'r\$\s*(\d+(?:[.,]\d+)?)',
            r'(\d+(?:[.,]\d+)?)\s*(?:ao\s+)?total',
        ]
        
        for pattern in total_patterns:
            match = re.search(pattern, question_lower, re.IGNORECASE)
            if match:
                value_str = match.group(1).replace(',', '.')
                # Verifica se tem "mil" próximo ao número
                match_end = match.end()
                context_after = question_lower[match.start():min(match_end + 15, len(question_lower))]
                if 'mil' in context_after and 'milh' not in context_after:
                    # Multiplica por 1000 se tiver "mil" (mas não "milhão")
                    extracted["total_amount"] = float(value_str) * 1000
                else:
                    extracted["total_amount"] = float(value_str)
                break
        
        # Detecta tipo de cálculo - mais abrangente
        if ('distribuir' in question_lower or 'dividir' in question_lower or 'alocar' in question_lower or 
            ('investir' in question_lower and ('%' in question or 'porcento' in question_lower or 'percentual' in question_lower))):
            extracted["calculation_type"] = "distribution"
        elif 'percentual' in question_lower or '%' in question or 'porcento' in question_lower or 'por cento' in question_lower:
            extracted["calculation_type"] = "percentage"
        elif 'juros' in question_lower or 'rendimento' in question_lower or 'compostos' in question_lower:
            extracted["calculation_type"] = "compound_interest"
        elif extracted["total_amount"] and ('%' in question or 'porcento' in question_lower):
            # Se tem total e percentuais, é distribuição
            extracted["calculation_type"] = "distribution"
        
        # Extrai percentuais - padrão mais robusto
        percentage_pattern = r'(\d+(?:[.,]\d+)?)\s*%'
        percentages = re.findall(percentage_pattern, question)
        if percentages:
            extracted["percentages"] = [float(p.replace(',', '.')) for p in percentages]
        
        # Extrai valores específicos - padrão mais robusto
        # Procura por padrões como "R$ 1000", "1000 reais", "mil reais"
        amount_patterns = [
            r'r\$\s*(\d+(?:[.,]\d+)?)',
            r'(\d+(?:[.,]\d+)?)\s*reais',
            r'(\d+(?:[.,]\d+)?)\s*mil\s*reais',
        ]
        amounts = []
        for pattern in amount_patterns:
            matches = re.findall(pattern, question_lower, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0] if match[0] else match[1]
                value_str = match.replace(',', '.')
                if 'mil' in pattern:
                    amounts.append(float(value_str) * 1000)
                else:
                    amounts.append(float(value_str))
        if amounts:
            # Remove duplicatas e o valor total se estiver na lista
            unique_amounts = []
            for amt in amounts:
                if extracted["total_amount"] and abs(amt - extracted["total_amount"]) < 1:
                    continue  # É o total, não um valor específico
                if amt not in unique_amounts:
                    unique_amounts.append(amt)
            extracted["amounts"] = unique_amounts
        
        # Extrai nomes de investimentos/targets
        # Procura por padrões como "em ações", "em fundos", "em tesouro"
        target_keywords = {
            'ações': 'Ações',
            'acao': 'Ações',
            'acoes': 'Ações',
            'fundos': 'Fundos',
            'fundo': 'Fundos',
            'tesouro': 'Tesouro Direto',
            'tesouro direto': 'Tesouro Direto',
            'cdb': 'CDB',
            'lci': 'LCI',
            'lca': 'LCA',
            'poupança': 'Poupança',
            'poupanca': 'Poupança',
            'renda fixa': 'Renda Fixa',
            'renda variavel': 'Renda Variável',
            'renda variável': 'Renda Variável',
        }
        
        targets = []
        for keyword, target_name in target_keywords.items():
            if keyword in question_lower:
                # Tenta encontrar o percentual ou valor associado
                # Procura padrões como "50% em ações", "mil reais em fundos"
                pattern = rf'(\d+(?:[.,]\d+)?)\s*(?:%|reais?|mil)\s*(?:em|para)\s*{keyword}'
                if re.search(pattern, question_lower, re.IGNORECASE):
                    if target_name not in targets:
                        targets.append(target_name)
        
        if targets:
            extracted["targets"] = targets
        
        # Se não encontrou targets mas tem percentuais, cria targets genéricos
        if not extracted["targets"] and extracted["percentages"]:
            extracted["targets"] = [f"Investimento {i+1}" for i in range(len(extracted["percentages"]))]
        
        return extracted


# Instância global do serviço
_calculator_service: Optional[CalculatorService] = None


def get_calculator_service() -> CalculatorService:
    """Retorna a instância do serviço de cálculos (lazy initialization)."""
    global _calculator_service
    if _calculator_service is None:
        _calculator_service = CalculatorService()
    return _calculator_service


if __name__ == "__main__":
    import sys
    
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

