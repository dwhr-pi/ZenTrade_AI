param(
  [switch]$List,
  [switch]$ListStrategies,
  [switch]$ListSelectors,
  [string[]]$Strategies
)

$ErrorActionPreference = 'Stop'

$RootDir = Resolve-Path (Join-Path $PSScriptRoot '..')
$StrategyRoot = if ($env:STRATEGY_ROOT) { $env:STRATEGY_ROOT } else { './extensions/strategies' }
$Exchange = if ($env:EXCHANGE) { $env:EXCHANGE } else { 'stub' }
$LegacySelector = if ($env:SELECTOR) { $env:SELECTOR } else { '' }
$Selectors = if ($env:SELECTORS) { $env:SELECTORS } else { '' }
$Products = if ($env:PRODUCTS) { $env:PRODUCTS } else { '' }
$MaxProducts = if ($env:MAX_PRODUCTS) { $env:MAX_PRODUCTS } else { '0' }
$AutoBackfill = if ($env:AUTO_BACKFILL) { $env:AUTO_BACKFILL } else { 'auto' }
$ZenbotBin = if ($env:ZENBOT_BIN) { $env:ZENBOT_BIN } else { 'node ./zenbot.js' }
$ConfPath = if ($env:CONF_PATH) { $env:CONF_PATH } else { './conf-examples/csv.conf.js' }
$Days = if ($env:DAYS) { $env:DAYS } else { '30' }
$BackfillDays = if ($env:BACKFILL_DAYS) { $env:BACKFILL_DAYS } else { $Days }
$PeriodLength = if ($env:PERIOD_LENGTH) { $env:PERIOD_LENGTH } else { '1m' }
$MinPeriods = if ($env:MIN_PERIODS) { $env:MIN_PERIODS } else { '52' }
$ReportDir = if ($env:REPORT_DIR) { $env:REPORT_DIR } else { './simulations/reports' }
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$ReportBasename = if ($env:REPORT_BASENAME) { $env:REPORT_BASENAME } else { "backtest_$Timestamp" }
$ReportFile = if ($env:REPORT_FILE) { $env:REPORT_FILE } else { "$ReportDir/$ReportBasename.txt" }
$ResultsJson = if ($env:RESULTS_JSON) { $env:RESULTS_JSON } else { "$ReportDir/$ReportBasename.json" }
$ResultsCsv = if ($env:RESULTS_CSV) { $env:RESULTS_CSV } else { "$ReportDir/$ReportBasename.csv" }
$RankingMd = if ($env:RANKING_MD) { $env:RANKING_MD } else { "$ReportDir/${ReportBasename}_ranking.md" }
$RawLogDir = if ($env:RAW_LOG_DIR) { $env:RAW_LOG_DIR } else { "$ReportDir/${ReportBasename}_logs" }
$WorkDataDir = if ($env:WORK_DATA_DIR) { $env:WORK_DATA_DIR } else { "$ReportDir/${ReportBasename}_data" }
$TmpResults = "$ReportDir/$ReportBasename.jsonl"
$HelperJs = './scripts/backtest_helper.js'

function Split-ListToLines {
  param([string]$Raw)
  if ([string]::IsNullOrWhiteSpace($Raw)) { return @() }
  return ($Raw -split '[,;\s]+' | Where-Object { $_ })
}

function Write-StrategyWarning {
@'
WARNING:
This script only includes strategy folders that are currently directly usable by Zenbot.
If a strategy is moved into a deeper or parked folder, it will be excluded from discovery.
Moving strategy folders can also affect other users, scripts, or running processes that still expect them.
If such dependencies exist, unavailable strategies can lead to failed runs or financial losses.
'@
}

function Invoke-NodeHelper {
  param([string[]]$Arguments)
  & node $HelperJs @Arguments
}

function Resolve-DbMode {
  Invoke-NodeHelper @('resolve-db-mode', $ConfPath)
}

function Discover-Strategies {
  $basePath = Join-Path $RootDir $StrategyRoot.TrimStart('./')
  if (-not (Test-Path $basePath)) { return @() }
  Get-ChildItem $basePath -Directory |
    Where-Object { $_.Name -notmatch '^[_\.]' -and (Test-Path (Join-Path $_.FullName 'strategy.js')) } |
    Sort-Object Name |
    ForEach-Object { $_.Name }
}

function Discover-SelectorsFromExchange {
  Invoke-NodeHelper @('discover-selectors', '.', $Exchange, $MaxProducts)
}

function Prepare-SelectorList {
  $resolved = New-Object System.Collections.Generic.List[string]
  if ($Selectors) {
    foreach ($selector in (Split-ListToLines $Selectors)) { $resolved.Add($selector) }
    return $resolved
  }
  if ($LegacySelector) {
    $resolved.Add($LegacySelector)
    return $resolved
  }
  if ($Products) {
    foreach ($product in (Split-ListToLines $Products)) { $resolved.Add("$Exchange.$product") }
    return $resolved
  }
  foreach ($selector in (Discover-SelectorsFromExchange)) {
    if ($selector) { $resolved.Add($selector) }
  }
  return $resolved
}

function Count-SimResults {
  param([string]$DbMode, [string]$DataDir)
  Invoke-NodeHelper @('count-sim-results', $DbMode, $DataDir)
}

function Extract-NewResult {
  param([string]$DbMode, [string]$DataDir, [string]$BeforeCount)
  Invoke-NodeHelper @('extract-new-result', $DbMode, $DataDir, $BeforeCount)
}

function Invoke-ZenbotWithBackend {
  param(
    [string]$DbMode,
    [string]$DataDir,
    [string[]]$Args
  )

  $parts = $ZenbotBin -split '\s+'
  $command = $parts[0]
  $commandArgs = @()
  if ($parts.Length -gt 1) { $commandArgs += $parts[1..($parts.Length - 1)] }
  $commandArgs += $Args

  $previous = @{
    ZENBOT_DB_TYPE = $env:ZENBOT_DB_TYPE
    ZENBOT_DB_CSV_DIR = $env:ZENBOT_DB_CSV_DIR
    ZENBOT_DB_SQL_DIALECT = $env:ZENBOT_DB_SQL_DIALECT
    ZENBOT_DB_SQL_DIR = $env:ZENBOT_DB_SQL_DIR
    ZENBOT_DB_SQL_STORAGE = $env:ZENBOT_DB_SQL_STORAGE
  }

  try {
    if ($DbMode -eq 'sql') {
      $env:ZENBOT_DB_TYPE = 'sql'
      $env:ZENBOT_DB_SQL_DIALECT = 'sqlite'
      $env:ZENBOT_DB_SQL_DIR = $DataDir
      $env:ZENBOT_DB_SQL_STORAGE = (Join-Path $DataDir 'zenbot.sqlite')
      Remove-Item Env:ZENBOT_DB_CSV_DIR -ErrorAction SilentlyContinue
    } elseif ($DbMode -eq 'csv') {
      $env:ZENBOT_DB_TYPE = 'csv'
      $env:ZENBOT_DB_CSV_DIR = $DataDir
      Remove-Item Env:ZENBOT_DB_SQL_DIALECT -ErrorAction SilentlyContinue
      Remove-Item Env:ZENBOT_DB_SQL_DIR -ErrorAction SilentlyContinue
      Remove-Item Env:ZENBOT_DB_SQL_STORAGE -ErrorAction SilentlyContinue
    }

    & $command @commandArgs
    return $LASTEXITCODE
  } finally {
    foreach ($key in $previous.Keys) {
      if ($null -eq $previous[$key]) {
        Remove-Item ("Env:$key") -ErrorAction SilentlyContinue
      } else {
        Set-Item ("Env:$key") $previous[$key]
      }
    }
  }
}

function Ensure-SelectorData {
  param(
    [string]$DbMode,
    [string]$Selector,
    [string]$DataDir
  )

  $tradeFile = Join-Path $DataDir 'trades.json'
  $sqlFile = Join-Path $DataDir 'zenbot.sqlite'
  $exchangeName = $Selector.Split('.')[0]
  $shouldBackfill = $false

  New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

  if ($AutoBackfill -eq '1') {
    $shouldBackfill = $true
  } elseif ($AutoBackfill -eq 'auto' -and $exchangeName -eq 'stub' -and $DbMode -eq 'csv' -and -not (Test-Path $tradeFile)) {
    $shouldBackfill = $true
  } elseif ($AutoBackfill -eq 'auto' -and $exchangeName -eq 'stub' -and $DbMode -eq 'sql' -and -not (Test-Path $sqlFile)) {
    $shouldBackfill = $true
  }

  if ($shouldBackfill) {
    "Preparing data for $Selector via backfill..." | Tee-Object -FilePath $ReportFile -Append | Out-Null
    $exitCode = Invoke-ZenbotWithBackend $DbMode $DataDir @('backfill', $Selector, '--conf', $ConfPath, '--days', $BackfillDays)
    if ($exitCode -ne 0) {
      "Backfill for $Selector ended with exit code $exitCode" | Tee-Object -FilePath $ReportFile -Append | Out-Null
    }
  }
}

function Safe-Name {
  param([string]$Name)
  return ($Name -replace '[\\/: ]', '_' -replace '\.', '_')
}

function Build-ResultRow {
  param(
    [string]$DbMode,
    [string]$Selector,
    [string]$Strategy,
    [string]$Status,
    [string]$DataDir,
    [string]$LogFile,
    [string]$SimResultFile
  )

  $exchangeName = $Selector.Split('.')[0]
  $productName = $Selector.Substring($Selector.IndexOf('.') + 1)
  Invoke-NodeHelper @('build-result-row', $Selector, $Strategy, $Status, $DbMode, $DataDir, $LogFile, $ReportFile, $ConfPath, $Days, $BackfillDays, $PeriodLength, $MinPeriods, $exchangeName, $productName, $SimResultFile)
}

Set-Location $RootDir
New-Item -ItemType Directory -Force -Path $ReportDir, $RawLogDir, $WorkDataDir | Out-Null
Set-Content -Path $TmpResults -Value ''

$DbMode = Resolve-DbMode
$DiscoveredStrategies = @(Discover-Strategies)
$ResolvedSelectors = @(Prepare-SelectorList)

if ($List -or $ListStrategies) {
  Write-Output (Write-StrategyWarning)
  Write-Output ''
  Write-Output 'Discovered strategies:'
  $DiscoveredStrategies
  exit 0
}

if ($ListSelectors) {
  Write-Output 'Resolved selectors:'
  $ResolvedSelectors
  exit 0
}

if (-not $Strategies -or $Strategies.Count -eq 0) {
  $Strategies = $DiscoveredStrategies
}

if ($DbMode -notin @('csv', 'sql')) {
  throw "The automated backtest flow currently supports csv or sql configs. Resolved db.type: $DbMode"
}

if (-not $Strategies -or $Strategies.Count -eq 0) {
  throw "No directly usable strategies were discovered in $StrategyRoot"
}

if (-not $ResolvedSelectors -or $ResolvedSelectors.Count -eq 0) {
  throw 'No selectors resolved. Use EXCHANGE, PRODUCTS, SELECTORS, or SELECTOR.'
}

@(
  '===================================================='
  'ZENBOT BACKTEST REPORT'
  "Date: $(Get-Date)"
  "Strategy root: $StrategyRoot"
  "Exchange discovery source: $Exchange"
  "Selectors resolved: $($ResolvedSelectors.Count)"
  "Strategies discovered: $($DiscoveredStrategies.Count)"
  "Strategies requested: $($Strategies.Count)"
  "Days: $Days"
  "Backfill days: $BackfillDays"
  "Period length: $PeriodLength"
  "Min periods: $MinPeriods"
  "Config: $ConfPath"
  "DB mode: $DbMode"
  "AUTO_BACKFILL: $AutoBackfill"
  '===================================================='
  ''
) | Set-Content -Path $ReportFile

Write-Output (Write-StrategyWarning) | Tee-Object -FilePath $ReportFile -Append | Out-Null
'' | Tee-Object -FilePath $ReportFile -Append | Out-Null
Write-Output "Text report: $ReportFile"
Write-Output "JSON results: $ResultsJson"
Write-Output "CSV results: $ResultsCsv"
Write-Output "Ranking: $RankingMd"

foreach ($selector in $ResolvedSelectors) {
  $selectorSafe = Safe-Name $selector
  $selectorDataDir = Join-Path $WorkDataDir $selectorSafe

  "Preparing selector: $selector" | Tee-Object -FilePath $ReportFile -Append | Out-Null
  Ensure-SelectorData $DbMode $selector $selectorDataDir

  foreach ($strategy in $Strategies) {
    $strategyPath = Join-Path (Join-Path $RootDir $StrategyRoot.TrimStart('./')) $strategy
    $strategyFile = Join-Path $strategyPath 'strategy.js'

    if (-not (Test-Path $strategyPath)) {
      "Skip missing strategy: $strategy" | Tee-Object -FilePath $ReportFile -Append | Out-Null
      (Build-ResultRow $DbMode $selector $strategy '999' $selectorDataDir $ReportFile '') | Add-Content -Path $TmpResults
      continue
    }

    if (-not (Test-Path $strategyFile)) {
      "Skip unusable strategy: $strategy" | Tee-Object -FilePath $ReportFile -Append | Out-Null
      (Build-ResultRow $DbMode $selector $strategy '998' $selectorDataDir $ReportFile '') | Add-Content -Path $TmpResults
      continue
    }

    $beforeCount = Count-SimResults $DbMode $selectorDataDir
    $logFile = Join-Path $RawLogDir "${selectorSafe}__${strategy}.log"
    $simResultFile = Join-Path $RawLogDir "${selectorSafe}__${strategy}.json"
    Set-Content -Path $simResultFile -Value ''

    "Running simulation for $selector with $strategy" | Tee-Object -FilePath $ReportFile -Append | Out-Null
    $null = Invoke-ZenbotWithBackend $DbMode $selectorDataDir @('sim', $selector, '--conf', $ConfPath, '--strategy', $strategy, '--days', $Days, '--period_length', $PeriodLength, '--min_periods', $MinPeriods, '--filename', 'none') *> $logFile
    $status = $LASTEXITCODE

    $afterCount = Count-SimResults $DbMode $selectorDataDir
    if ([int]$afterCount -gt [int]$beforeCount) {
      Extract-NewResult $DbMode $selectorDataDir $beforeCount | Set-Content -Path $simResultFile
    }

    Get-Content $logFile | Add-Content -Path $ReportFile
    '----------------------------------------------------' | Add-Content -Path $ReportFile

    (Build-ResultRow $DbMode $selector $strategy "$status" $selectorDataDir $logFile $simResultFile) | Add-Content -Path $TmpResults
  }
}

Invoke-NodeHelper @('generate-outputs', $TmpResults, $ResultsJson, $ResultsCsv, $RankingMd, $ReportFile) | Out-Null

Write-Output 'Finished.'
Write-Output "Text report: $ReportFile"
Write-Output "JSON results: $ResultsJson"
Write-Output "CSV results: $ResultsCsv"
Write-Output "Ranking: $RankingMd"
