import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StockChartProps {
  ticker: string;
  period?: string;
  interval?: string;
  height?: number;
}

export function StockChart({ ticker, period = "1mo", interval = "1d", height = 300 }: StockChartProps) {
  const { data: history, isLoading, error } = trpc.stocks.history.useQuery({
    ticker,
    period,
    interval,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error(`[StockChart] Erro ao carregar ${ticker}:`, error);
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <p className="text-muted-foreground font-semibold">
            Erro ao carregar gráfico
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {error?.message || "Erro desconhecido"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!history) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">
            Carregando dados de {ticker}...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!history.success) {
    console.warn(`[StockChart] Dados não disponíveis para ${ticker}:`, history.error);
    const isRateLimited = (history as any).rate_limited;
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-[300px]">
          <p className={`font-semibold ${isRateLimited ? 'text-yellow-800' : 'text-muted-foreground'}`}>
            {isRateLimited ? "⚠️ Limite de requisições" : `Dados não disponíveis para ${ticker}`}
          </p>
          {history.error && (
            <p className={`text-sm mt-2 ${isRateLimited ? 'text-yellow-700' : 'text-muted-foreground'}`}>
              {history.error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const chartData = (history.history || []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: item.close,
    fullDate: item.date,
  }));

  const firstPrice = history.first_close || 0;
  const lastPrice = history.last_close || 0;
  const change = lastPrice - firstPrice;
  const changePercent = history.period_change_percent || 0;
  const isPositive = change >= 0;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">{ticker}</CardTitle>
            <CardDescription className="mt-1">
              {history.normalized_ticker || ticker} • {period}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {history.currency === 'USD' ? '$' : 'R$'} {lastPrice.toFixed(2)}
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`color${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(value) => `${history.currency === 'USD' ? '$' : 'R$'} ${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              formatter={(value: number) => [`${history.currency === 'USD' ? '$' : 'R$'} ${value.toFixed(2)}`, 'Preço']}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth={2}
              fill={`url(#color${ticker})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

