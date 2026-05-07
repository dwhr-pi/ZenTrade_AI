#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRATEGY_ROOT="${STRATEGY_ROOT:-./extensions/strategies}"
EXCHANGE="${EXCHANGE:-stub}"
LEGACY_SELECTOR="${SELECTOR:-}"
SELECTORS="${SELECTORS:-}"
PRODUCTS="${PRODUCTS:-}"
MAX_PRODUCTS="${MAX_PRODUCTS:-0}"
AUTO_BACKFILL="${AUTO_BACKFILL:-auto}"
ZENBOT_BIN="${ZENBOT_BIN:-node ./zenbot.js}"
CONF_PATH="${CONF_PATH:-./conf-examples/csv.conf.js}"
DAYS="${DAYS:-30}"
BACKFILL_DAYS="${BACKFILL_DAYS:-$DAYS}"
PERIOD_LENGTH="${PERIOD_LENGTH:-1m}"
MIN_PERIODS="${MIN_PERIODS:-52}"
REPORT_DIR="${REPORT_DIR:-./simulations/reports}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
REPORT_BASENAME="${REPORT_BASENAME:-backtest_${TIMESTAMP}}"
REPORT_FILE="${REPORT_FILE:-${REPORT_DIR}/${REPORT_BASENAME}.txt}"
RESULTS_JSON="${RESULTS_JSON:-${REPORT_DIR}/${REPORT_BASENAME}.json}"
RESULTS_CSV="${RESULTS_CSV:-${REPORT_DIR}/${REPORT_BASENAME}.csv}"
RANKING_MD="${RANKING_MD:-${REPORT_DIR}/${REPORT_BASENAME}_ranking.md}"
RAW_LOG_DIR="${RAW_LOG_DIR:-${REPORT_DIR}/${REPORT_BASENAME}_logs}"
WORK_DATA_DIR="${WORK_DATA_DIR:-${REPORT_DIR}/${REPORT_BASENAME}_data}"
TMP_RESULTS="${REPORT_DIR}/${REPORT_BASENAME}.jsonl"
HELPER_JS="./scripts/backtest_helper.js"
DB_MODE=""

declare -a STRATEGIES=()
declare -a DISCOVERED_STRATEGIES=()
declare -a RESOLVED_SELECTORS=()

usage() {
  cat <<'EOF'
Usage:
  ./scripts/run_backtests.sh [strategy1 strategy2 ...]
  ./scripts/run_backtests.sh --list
  ./scripts/run_backtests.sh --list-strategies
  ./scripts/run_backtests.sh --list-selectors

Optional environment variables:
  STRATEGY_ROOT   Strategy directory, default ./extensions/strategies
  EXCHANGE        Exchange for selector discovery, default stub
  SELECTORS       Comma- or space-separated selectors, overrides EXCHANGE discovery
  PRODUCTS        Comma- or space-separated product ids like BTC-USD, used with EXCHANGE
  MAX_PRODUCTS    Limit auto-discovered exchange products, 0 means unlimited
  AUTO_BACKFILL   auto, 0, or 1
  ZENBOT_BIN      Command for Zenbot execution, default "node ./zenbot.js"
  CONF_PATH       Config override, default ./conf-examples/csv.conf.js
  DAYS            Sim period, default 30
  BACKFILL_DAYS   Backfill period, default DAYS
  PERIOD_LENGTH   Period length, default 1m
  MIN_PERIODS     Min periods, default 52
  REPORT_DIR      Output directory, default ./simulations/reports

Examples:
  ./scripts/run_backtests.sh
  ./scripts/run_backtests.sh --list-strategies
  ./scripts/run_backtests.sh --list-selectors
  EXCHANGE=gdax MAX_PRODUCTS=5 ./scripts/run_backtests.sh
  PRODUCTS=BTC-USD,ETH-USD EXCHANGE=gdax ./scripts/run_backtests.sh trend_ema macd
  SELECTORS=gdax.BTC-USD,binance.ETH-BTC ./scripts/run_backtests.sh volume_universal
  AUTO_BACKFILL=1 CONF_PATH=./conf-examples/csv-live.conf.js EXCHANGE=gdax PRODUCTS=BTC-USD ./scripts/run_backtests.sh
EOF
}

print_strategy_warning() {
  cat <<'EOF'
WARNING:
This script only includes strategy folders that are currently directly usable by Zenbot.
If a strategy is moved into a deeper or parked folder, it will be excluded from discovery.
Moving strategy folders can also affect other users, scripts, or running processes that still expect them.
If such dependencies exist, unavailable strategies can lead to failed runs or financial losses.
EOF
}

split_list_to_lines() {
  local raw="$1"
  printf '%s' "$raw" | tr ',;' '\n' | tr ' ' '\n' | sed '/^$/d'
}

discover_strategies() {
  local dir_path
  local dir_name
  local found=()

  while IFS= read -r -d '' dir_path; do
    dir_name="$(basename "$dir_path")"
    if [[ "$dir_name" == _* || "$dir_name" == .* ]]; then
      continue
    fi
    if [[ -f "$dir_path/strategy.js" ]]; then
      found+=("$dir_name")
    fi
  done < <(find "$STRATEGY_ROOT" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z)

  printf '%s\n' "${found[@]}"
}

discover_selectors_from_exchange() {
  local exchange_name="$1"
  local max_products="$2"
  node "$HELPER_JS" discover-selectors "." "$exchange_name" "$max_products"
}

resolve_db_mode() {
  node "$HELPER_JS" resolve-db-mode "$CONF_PATH"
}

build_selectors_from_products() {
  local exchange_name="$1"
  local raw_products="$2"
  while IFS= read -r product; do
    [[ -n "$product" ]] && printf '%s.%s\n' "$exchange_name" "$product"
  done < <(split_list_to_lines "$raw_products")
}

prepare_selector_list() {
  local selector
  if [[ -n "$SELECTORS" ]]; then
    while IFS= read -r selector; do
      [[ -n "$selector" ]] && RESOLVED_SELECTORS+=("$selector")
    done < <(split_list_to_lines "$SELECTORS")
    return
  fi

  if [[ -n "$LEGACY_SELECTOR" ]]; then
    RESOLVED_SELECTORS+=("$LEGACY_SELECTOR")
    return
  fi

  if [[ -n "$PRODUCTS" ]]; then
    while IFS= read -r selector; do
      [[ -n "$selector" ]] && RESOLVED_SELECTORS+=("$selector")
    done < <(build_selectors_from_products "$EXCHANGE" "$PRODUCTS")
    return
  fi

  while IFS= read -r selector; do
    [[ -n "$selector" ]] && RESOLVED_SELECTORS+=("$selector")
  done < <(discover_selectors_from_exchange "$EXCHANGE" "$MAX_PRODUCTS")
}

count_sim_results() {
  local data_dir="$1"
  node "$HELPER_JS" count-sim-results "$DB_MODE" "$data_dir"
}

extract_new_result() {
  local data_dir="$1"
  local before_count="$2"
  node "$HELPER_JS" extract-new-result "$DB_MODE" "$data_dir" "$before_count"
}

run_zenbot_with_backend() {
  local data_dir="$1"
  shift

  if [[ "$DB_MODE" == "sql" ]]; then
    ZENBOT_DB_TYPE=sql \
    ZENBOT_DB_SQL_DIALECT=sqlite \
    ZENBOT_DB_SQL_DIR="$data_dir" \
    ZENBOT_DB_SQL_STORAGE="${data_dir}/zenbot.sqlite" \
    "${ZENBOT_CMD[@]}" "$@"
    return
  fi

  if [[ "$DB_MODE" == "csv" ]]; then
    ZENBOT_DB_TYPE=csv ZENBOT_DB_CSV_DIR="$data_dir" "${ZENBOT_CMD[@]}" "$@"
    return
  fi

  "${ZENBOT_CMD[@]}" "$@"
}

ensure_selector_data() {
  local selector="$1"
  local data_dir="$2"
  local trade_file="${data_dir}/trades.json"
  local sql_file="${data_dir}/zenbot.sqlite"
  local exchange_name="${selector%%.*}"
  local should_backfill=0

  mkdir -p "$data_dir"

  if [[ "$AUTO_BACKFILL" == "1" ]]; then
    should_backfill=1
  elif [[ "$AUTO_BACKFILL" == "auto" && "$exchange_name" == "stub" && "$DB_MODE" == "csv" && ! -s "$trade_file" ]]; then
    should_backfill=1
  elif [[ "$AUTO_BACKFILL" == "auto" && "$exchange_name" == "stub" && "$DB_MODE" == "sql" && ! -s "$sql_file" ]]; then
    should_backfill=1
  fi

  if [[ "$should_backfill" -eq 1 ]]; then
    echo "Preparing data for ${selector} via backfill..."
    run_zenbot_with_backend "$data_dir" backfill "$selector" --conf "$CONF_PATH" --days "$BACKFILL_DAYS" >> "$REPORT_FILE" 2>&1 || true
  fi
}

safe_name() {
  printf '%s' "$1" | sed 's#[\\/: ]#_#g; s#\.#_#g'
}

append_result_row() {
  local result_json="$1"
  printf '%s\n' "$result_json" >> "$TMP_RESULTS"
}

build_result_row() {
  local selector="$1"
  local strategy="$2"
  local status="$3"
  local data_dir="$4"
  local log_file="$5"
  local report_file="$6"
  local sim_result_file="$7"
  local exchange_name="${selector%%.*}"
  local product_name="${selector#*.}"

  node "$HELPER_JS" build-result-row "$selector" "$strategy" "$status" "$DB_MODE" "$data_dir" "$log_file" "$report_file" "$CONF_PATH" "$DAYS" "$BACKFILL_DAYS" "$PERIOD_LENGTH" "$MIN_PERIODS" "$exchange_name" "$product_name" "$sim_result_file"
}

generate_outputs() {
  node "$HELPER_JS" generate-outputs "$TMP_RESULTS" "$RESULTS_JSON" "$RESULTS_CSV" "$RANKING_MD" "$REPORT_FILE"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

cd "$ROOT_DIR" || exit 1
mkdir -p "$REPORT_DIR" "$RAW_LOG_DIR" "$WORK_DATA_DIR"
: > "$TMP_RESULTS"

if [[ ! -d "$STRATEGY_ROOT" ]]; then
  echo "Strategy root not found: $STRATEGY_ROOT"
  exit 1
fi

while IFS= read -r strategy; do
  [[ -n "$strategy" ]] && DISCOVERED_STRATEGIES+=("$strategy")
done < <(discover_strategies)

prepare_selector_list

DB_MODE="$(resolve_db_mode)"

if [[ "${1:-}" == "--list" || "${1:-}" == "--list-strategies" ]]; then
  print_strategy_warning
  echo
  echo "Discovered strategies:"
  printf '%s\n' "${DISCOVERED_STRATEGIES[@]}"
  exit 0
fi

if [[ "${1:-}" == "--list-selectors" ]]; then
  echo "Resolved selectors:"
  printf '%s\n' "${RESOLVED_SELECTORS[@]}"
  exit 0
fi

if [[ "$#" -gt 0 ]]; then
  STRATEGIES=("$@")
else
  STRATEGIES=("${DISCOVERED_STRATEGIES[@]}")
fi

if [[ "${#STRATEGIES[@]}" -eq 0 ]]; then
  echo "No directly usable strategies were discovered in $STRATEGY_ROOT"
  exit 1
fi

if [[ "${#RESOLVED_SELECTORS[@]}" -eq 0 ]]; then
  echo "No selectors resolved. Use EXCHANGE, PRODUCTS, SELECTORS, or SELECTOR."
  exit 1
fi

read -r -a ZENBOT_CMD <<< "$ZENBOT_BIN"

if [[ "$DB_MODE" != "csv" && "$DB_MODE" != "sql" ]]; then
  echo "The automated backtest flow currently supports csv or sql configs. Resolved db.type: $DB_MODE"
  exit 1
fi

{
  echo "===================================================="
  echo "ZENBOT BACKTEST REPORT"
  echo "Date: $(date)"
  echo "Strategy root: ${STRATEGY_ROOT}"
  echo "Exchange discovery source: ${EXCHANGE}"
  echo "Selectors resolved: ${#RESOLVED_SELECTORS[@]}"
  echo "Strategies discovered: ${#DISCOVERED_STRATEGIES[@]}"
  echo "Strategies requested: ${#STRATEGIES[@]}"
  echo "Days: ${DAYS}"
  echo "Backfill days: ${BACKFILL_DAYS}"
  echo "Period length: ${PERIOD_LENGTH}"
  echo "Min periods: ${MIN_PERIODS}"
  echo "Config: ${CONF_PATH}"
  echo "DB mode: ${DB_MODE}"
  echo "AUTO_BACKFILL: ${AUTO_BACKFILL}"
  echo "===================================================="
  echo
} > "$REPORT_FILE"

print_strategy_warning | tee -a "$REPORT_FILE"
echo | tee -a "$REPORT_FILE"
echo "Text report: $REPORT_FILE"
echo "JSON results: $RESULTS_JSON"
echo "CSV results: $RESULTS_CSV"
echo "Ranking: $RANKING_MD"

for selector in "${RESOLVED_SELECTORS[@]}"; do
  selector_safe="$(safe_name "$selector")"
  selector_data_dir="${WORK_DATA_DIR}/${selector_safe}"

  echo "Preparing selector: ${selector}" | tee -a "$REPORT_FILE"
  ensure_selector_data "$selector" "$selector_data_dir"

  for strategy in "${STRATEGIES[@]}"; do
    if [[ ! -d "${STRATEGY_ROOT}/${strategy}" ]]; then
      echo "Skip missing strategy: ${strategy}" | tee -a "$REPORT_FILE"
      row="$(build_result_row "$selector" "$strategy" 999 "$selector_data_dir" "$REPORT_FILE" "$REPORT_FILE" "")"
      append_result_row "$row"
      continue
    fi

    if [[ ! -f "${STRATEGY_ROOT}/${strategy}/strategy.js" ]]; then
      echo "Skip unusable strategy: ${strategy}" | tee -a "$REPORT_FILE"
      row="$(build_result_row "$selector" "$strategy" 998 "$selector_data_dir" "$REPORT_FILE" "$REPORT_FILE" "")"
      append_result_row "$row"
      continue
    fi

    before_count="$(count_sim_results "$selector_data_dir")"
    log_file="${RAW_LOG_DIR}/${selector_safe}__${strategy}.log"
    sim_result_file="${RAW_LOG_DIR}/${selector_safe}__${strategy}.json"
    : > "$sim_result_file"

    echo "Running simulation for ${selector} with ${strategy}" | tee -a "$REPORT_FILE"
    run_zenbot_with_backend "$selector_data_dir" sim "$selector" --conf "$CONF_PATH" --strategy "$strategy" --days "$DAYS" --period_length "$PERIOD_LENGTH" --min_periods "$MIN_PERIODS" --filename none > "$log_file" 2>&1
    status=$?
    after_count="$(count_sim_results "$selector_data_dir")"
    if [[ "$after_count" -gt "$before_count" ]]; then
      extract_new_result "$selector_data_dir" "$before_count" > "$sim_result_file"
    fi

    cat "$log_file" >> "$REPORT_FILE"
    printf '\n----------------------------------------------------\n' >> "$REPORT_FILE"

    row="$(build_result_row "$selector" "$strategy" "$status" "$selector_data_dir" "$log_file" "$REPORT_FILE" "$sim_result_file")"
    append_result_row "$row"
  done
done

generate_outputs

echo "Finished."
echo "Text report: $REPORT_FILE"
echo "JSON results: $RESULTS_JSON"
echo "CSV results: $RESULTS_CSV"
echo "Ranking: $RANKING_MD"
