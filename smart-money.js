import axios from "axios";
import { withRetry429 } from "./monitor.js";

const BASE_URL = "https://public-api.birdeye.so";
const headers = {
  "X-API-KEY": process.env.BIRDEYE_API_KEY,
  "x-chain": "solana",
  accept: "application/json",
};

function formatUsd(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(number));
}

function getConfig() {
  return {
    interval: process.env.SMART_MONEY_INTERVAL ?? "1d",
    traderStyle: process.env.SMART_MONEY_TRADER_STYLE ?? "all",
    sortBy: process.env.SMART_MONEY_SORT_BY ?? "net_flow",
    sortType: process.env.SMART_MONEY_SORT_TYPE ?? "desc",
    limit: Number.parseInt(process.env.SMART_MONEY_LIMIT ?? "10", 10),
    minVolumeUsd: Number.parseFloat(process.env.SMART_MONEY_MIN_VOLUME ?? "0"),
  };
}

function getStyleLabel(style) {
  if (style === "risk_averse") {
    return "risk-averse";
  }

  if (style === "risk_balancers") {
    return "balanced";
  }

  if (style === "trenchers") {
    return "high-risk";
  }

  return "smart";
}

export async function fetchSmartMoneySignals() {
  const { interval, traderStyle, sortBy, sortType, limit, minVolumeUsd } =
    getConfig();

  try {
    const response = await withRetry429(
      () =>
        axios.get(`${BASE_URL}/smart-money/v1/token/list`, {
          headers,
          params: {
            interval,
            trader_style: traderStyle,
            sort_by: sortBy,
            sort_type: sortType,
            limit,
          },
        }),
      { label: "smart-money token list" },
    );

    const items = response.data?.data ?? [];
    const nowUnix = Math.floor(Date.now() / 1000);

    return items
      .filter((item) => item?.token && item?.symbol)
      .map((item) => {
        const netFlow = Number(item?.net_flow ?? 0);
        const volumeUsd = Number(item?.volume_usd ?? 0);
        const measuredVolume = Number.isFinite(volumeUsd)
          ? volumeUsd
          : Number.isFinite(netFlow)
            ? netFlow
            : 0;

        const traderCount = Number(item?.smart_traders_no ?? 0);
        const tokenLabel = item?.name
          ? `${item.name} (${item.symbol})`
          : item.symbol;
        const styleLabel = getStyleLabel(item?.trader_style);
        const explanation =
          `Smart money ${styleLabel} is rotating into ${tokenLabel}. ` +
          `Net flow ${formatUsd(netFlow)} with ${traderCount} traders over ${interval}.`;

        return {
          wallet: "smart-money",
          tokenSymbol: item.symbol,
          tokenAddress: item.token,
          volumeUsd: Math.abs(measuredVolume),
          txHash: null,
          source: `smart_money:${item?.trader_style ?? "all"}`,
          timestamp: nowUnix,
          explanation,
          skip:
            Number.isFinite(minVolumeUsd) &&
            minVolumeUsd > 0 &&
            Math.abs(measuredVolume) < minVolumeUsd,
        };
      })
      .filter((item) => !item.skip)
      .map(({ skip, ...signal }) => signal);
  } catch (err) {
    console.error(
      "[smart-money] Failed to fetch smart-money tokens:",
      err.response?.data ?? err.message ?? err,
    );
    return [];
  }
}
