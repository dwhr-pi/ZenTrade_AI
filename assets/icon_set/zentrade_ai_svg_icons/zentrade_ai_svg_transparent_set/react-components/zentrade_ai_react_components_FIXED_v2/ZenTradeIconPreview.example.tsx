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
      <h1 className="mb-6 text-2xl font-bold">ZenTrade AI Icon Preview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><AiAnalyticsIcon size={96} /><span className="text-xs">ai-analytics.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><AiRobotWomanIcon size={96} /><span className="text-xs">ai-robot-woman.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><AlertsIcon size={96} /><span className="text-xs">alerts.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><AutoTradingIcon size={96} /><span className="text-xs">auto-trading.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><Continuous247Icon size={96} /><span className="text-xs">continuous-247.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><FastExecutionIcon size={96} /><span className="text-xs">fast-execution.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><FaviconZIcon size={96} /><span className="text-xs">favicon-z.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><GithubAvatarIcon size={96} /><span className="text-xs">github-avatar.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><MarketScanIcon size={96} /><span className="text-xs">market-scan.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><PortfolioIcon size={96} /><span className="text-xs">portfolio.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><RiskManagementIcon size={96} /><span className="text-xs">risk-management.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><SettingsIcon size={96} /><span className="text-xs">settings.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><WalletIcon size={96} /><span className="text-xs">wallet.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><ZentradeAiBrandIconIcon size={96} /><span className="text-xs">zentrade-ai-brand-icon.svg</span></div>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-900 p-4"><ZentradeAiIcon size={96} /><span className="text-xs">zentrade-ai.svg</span></div>
      </div>
    </div>
  );
}
