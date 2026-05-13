import {
  AiAnalyticsIcon,
  AiRobotWomanIcon,
  AlertsIcon,
  AutoTradingIcon,
  Continuous247Icon,
  FastExecutionIcon,
  FaviconZIcon,
  GithubAvatarIcon,
  MarketScanIcon,
  PortfolioIcon,
  RiskManagementIcon,
  SettingsIcon,
  WalletIcon,
  ZentradeAiBrandIconIcon,
  ZentradeAiIcon
} from "./react-components";

export default function ZenTradeIconPreview() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="mb-6 text-2xl font-bold">ZenTrade AI Icon Set</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><AiAnalyticsIcon size={72} /><span className="text-xs text-slate-300">ai-analytics.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><AiRobotWomanIcon size={72} /><span className="text-xs text-slate-300">ai-robot-woman.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><AlertsIcon size={72} /><span className="text-xs text-slate-300">alerts.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><AutoTradingIcon size={72} /><span className="text-xs text-slate-300">auto-trading.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><Continuous247Icon size={72} /><span className="text-xs text-slate-300">continuous-247.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><FastExecutionIcon size={72} /><span className="text-xs text-slate-300">fast-execution.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><FaviconZIcon size={72} /><span className="text-xs text-slate-300">favicon-z.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><GithubAvatarIcon size={72} /><span className="text-xs text-slate-300">github-avatar.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><MarketScanIcon size={72} /><span className="text-xs text-slate-300">market-scan.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><PortfolioIcon size={72} /><span className="text-xs text-slate-300">portfolio.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><RiskManagementIcon size={72} /><span className="text-xs text-slate-300">risk-management.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><SettingsIcon size={72} /><span className="text-xs text-slate-300">settings.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><WalletIcon size={72} /><span className="text-xs text-slate-300">wallet.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><ZentradeAiBrandIconIcon size={72} /><span className="text-xs text-slate-300">zentrade-ai-brand-icon.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900/70 p-4"><ZentradeAiIcon size={72} /><span className="text-xs text-slate-300">zentrade-ai.svg</span></div>
      </div>
    </div>
  );
}
