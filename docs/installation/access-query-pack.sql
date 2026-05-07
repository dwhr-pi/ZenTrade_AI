-- Access Query Pack fuer ZenTrade_AI
-- Diese SELECTs koennen in Access jeweils als gespeicherte Abfrage angelegt werden.

-- q_TradesWithContext
SELECT
  t.TradeID,
  t.Timestamp,
  a.Symbol,
  s.StrategyName,
  t.TradeType,
  t.Quantity,
  t.Price,
  t.TotalValue,
  t.Status
FROM
  (Trades AS t
  LEFT JOIN Assets AS a ON t.AssetID = a.AssetID)
  LEFT JOIN Strategies AS s ON t.StrategyID = s.StrategyID
ORDER BY
  t.Timestamp DESC;

-- q_StrategySessionPerformance
SELECT
  ts.SessionID,
  s.StrategyName,
  ts.StartTime,
  ts.EndTime,
  ts.InitialBalance,
  ts.FinalBalance,
  ts.TotalTrades,
  ts.ProfitLoss,
  ts.Status
FROM
  Trading_Sessions AS ts
  LEFT JOIN Strategies AS s ON ts.StrategyID = s.StrategyID
ORDER BY
  ts.EndTime DESC;

-- q_PortfolioLatest
SELECT
  p.PortfolioID,
  a.Symbol,
  p.Quantity,
  p.AveragePrice,
  p.TotalValue,
  p.LastUpdated
FROM
  Portfolio AS p
  LEFT JOIN Assets AS a ON p.AssetID = a.AssetID
ORDER BY
  p.LastUpdated DESC;

-- q_RecentCandles
SELECT TOP 500
  c.CandleID,
  a.Symbol,
  c.Timestamp,
  c.OpenPrice,
  c.HighPrice,
  c.LowPrice,
  c.ClosePrice,
  c.Volume,
  c.Timeframe
FROM
  Candlestick_Data AS c
  LEFT JOIN Assets AS a ON c.AssetID = a.AssetID
ORDER BY
  c.Timestamp DESC;

-- q_DerivedIndicatorSnapshot
SELECT TOP 1000
  m.IndicatorID,
  a.Symbol,
  m.IndicatorType,
  m.Value,
  m.Timestamp,
  m.Timeframe
FROM
  Market_Indicators AS m
  LEFT JOIN Assets AS a ON m.AssetID = a.AssetID
WHERE
  m.IndicatorType IN ('VWAP_DERIVED', 'TRADE_COUNT', 'VOLUME_DERIVED', 'LAST_PRICE', 'RSI', 'EMA_SHORT', 'EMA_LONG', 'VWAP')
ORDER BY
  m.Timestamp DESC,
  m.IndicatorType ASC;

-- q_TradeVolumeByDay
SELECT
  DateValue([Timestamp]) AS TradeDate,
  Count(*) AS TradeCount,
  Sum(Nz([TotalValue], 0)) AS GrossTurnover
FROM
  Trades
GROUP BY
  DateValue([Timestamp])
ORDER BY
  DateValue([Timestamp]) DESC;
