import { StockCard } from "./StockCard";
import { StockChart } from "./StockChart";

const POPULAR_STOCKS = [
  { ticker: "PETR4", name: "Petrobras" },
  { ticker: "VALE3", name: "Vale" },
  { ticker: "ITUB4", name: "Itaú Unibanco" },
  { ticker: "BBDC4", name: "Bradesco" },
  { ticker: "ABEV3", name: "Ambev" },
  { ticker: "WEGE3", name: "Weg" },
];

export function StockGrid() {
  return (
    <div className="space-y-8">
      {/* Grid de Cards de Ações */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ações em Destaque</h2>
          <p className="text-gray-600">Principais ações da bolsa brasileira</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_STOCKS.map((stock) => (
            <StockCard key={stock.ticker} ticker={stock.ticker} name={stock.name} />
          ))}
        </div>
      </div>

      {/* Gráficos Principais */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Análise de Mercado</h2>
          <p className="text-gray-600">Gráficos de performance das principais ações</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StockChart ticker="PETR4" period="1mo" height={350} />
          <StockChart ticker="VALE3" period="1mo" height={350} />
        </div>
      </div>
    </div>
  );
}

