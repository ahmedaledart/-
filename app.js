const API_URL = new URLSearchParams(window.location.search).get("api") || "./market-data.json";
const REFRESH_INTERVAL_MS = 60000;

const fallbackData = {
  العملات: [
    { rank: 1, currency: "الدولار الامريكي", unit: "دولار واحد", officialRate: 5.44, parallelRate: 9.015 },
    { rank: 2, currency: "اليورو", unit: "يورو واحد", officialRate: 6.33, parallelRate: 10.4 },
    { rank: 3, currency: "الجنيه الاسترليني", unit: "جنيه واحد", officialRate: 7.3, parallelRate: 11.83 },
    { rank: 4, currency: "الدرهم الاماراتي", unit: "درهم واحد", officialRate: 1.47, parallelRate: 2.4 },
    { rank: 5, currency: "الدينار التونسي", unit: "دينار واحد", officialRate: 1.88, parallelRate: 2.97 },
    { rank: 6, currency: "الليرة التركية", unit: "ليرة واحدة", officialRate: 0.13, parallelRate: 0.208 },
    { rank: 7, currency: "الدينار الإردني", unit: "دينار واحد", officialRate: 7.66, parallelRate: 12.67 },
    { rank: 8, currency: "الجنيه المصري", unit: "جنيه واحد", officialRate: 0.11, parallelRate: 12.53 },
    { rank: 9, currency: "الريال السعودي", unit: "ريال واحد", officialRate: 1.44, parallelRate: 2.38 },
    { rank: 10, currency: "الايوان الصيني", unit: "ايوان واحد", officialRate: 0.76, parallelRate: 1.25 },
  ],
  المعادن: [
    { asset: "الذهب (XAU)", price: "$2,362", change: 0.88, volume: "$640M", status: "مباشر" },
    { asset: "الفضة (XAG)", price: "$30.12", change: -0.44, volume: "$320M", status: "مراقبة" },
    { asset: "النحاس", price: "$4.53", change: 0.27, volume: "$211M", status: "مباشر" },
  ],
  "الخامات النفطية": [
    { asset: "نفط برنت", price: "$81.14", change: -1.04, volume: "$1.2B", status: "مراقبة" },
    { asset: "خام غرب تكساس", price: "$77.95", change: -0.66, volume: "$1.1B", status: "مباشر" },
    { asset: "زيت التدفئة", price: "$2.47", change: 0.12, volume: "$410M", status: "مباشر" },
  ],
  "السلع الأساسية": [
    { asset: "القمح", price: "$6.28", change: 0.93, volume: "$180M", status: "مباشر" },
    { asset: "الذرة", price: "$4.42", change: -0.22, volume: "$165M", status: "مراقبة" },
    { asset: "السكر الخام", price: "$0.23", change: 0.38, volume: "$104M", status: "مباشر" },
  ],
};

const requiredSectors = ["العملات", "المعادن", "الخامات النفطية", "السلع الأساسية"];

const tabsContainer = document.getElementById("sectors");
const headContainer = document.getElementById("tableHead");
const rowsContainer = document.getElementById("marketRows");
const apiSource = document.getElementById("apiSource");
const apiState = document.getElementById("apiState");
const apiUpdatedAt = document.getElementById("apiUpdatedAt");

const activeAssets = document.getElementById("activeAssets");
const winnersRatio = document.getElementById("winnersRatio");
const totalVolume = document.getElementById("totalVolume");
const volatility = document.getElementById("volatility");

let marketData = {};
let sectors = [];
let activeSector = "";

function isDashboardPage() {
  return Boolean(
    tabsContainer &&
      headContainer &&
      rowsContainer &&
      apiSource &&
      apiState &&
      activeAssets &&
      winnersRatio &&
      totalVolume &&
      volatility
  );
}

function parseVolumeToBillions(volume) {
  const normalized = String(volume).replace("$", "").trim();

  if (normalized.endsWith("B")) {
    return Number(normalized.replace("B", ""));
  }

  if (normalized.endsWith("M")) {
    return Number(normalized.replace("M", "")) / 1000;
  }

  if (normalized.endsWith("K")) {
    return Number(normalized.replace("K", "")) / 1000000;
  }

  return Number(normalized) || 0;
}

function validateCurrencies(data) {
  return data.every(
    (item) =>
      typeof item.rank === "number" &&
      typeof item.currency === "string" &&
      typeof item.unit === "string" &&
      typeof item.officialRate === "number" &&
      typeof item.parallelRate === "number"
  );
}

function validateMarketData(data) {
  if (!data || typeof data !== "object") {
    return false;
  }

  if (!requiredSectors.every((sector) => Array.isArray(data[sector]) && data[sector].length > 0)) {
    return false;
  }

  return validateCurrencies(data["العملات"]);
}

function markUpdatedNow() {
  if (apiUpdatedAt) {
    apiUpdatedAt.textContent = new Date().toLocaleTimeString("ar-LY");
  }
}

async function loadMarketData() {
  try {
    apiSource.textContent = API_URL;
    apiState.textContent = "جاري التحميل...";

    const response = await fetch(API_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!validateMarketData(data)) {
      throw new Error("صيغة البيانات غير مطابقة");
    }

    apiState.textContent = "متصل";
    markUpdatedNow();
    return data;
  } catch (error) {
    apiState.textContent = "وضع احتياطي";
    markUpdatedNow();
    console.error("API load failed, using fallback data:", error);
    return fallbackData;
  }
}

function renderTabs() {
  tabsContainer.innerHTML = "";
  sectors.forEach((sector) => {
    const tab = document.createElement("button");
    tab.className = `sector-tab ${sector === activeSector ? "active" : ""}`;
    tab.textContent = sector;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(sector === activeSector));
    tab.addEventListener("click", () => {
      activeSector = sector;
      renderTabs();
      renderTable();
      renderSummary();
    });
    tabsContainer.appendChild(tab);
  });
}

function renderCurrencyTable(data) {
  headContainer.classList.add("currency-head");
  headContainer.innerHTML =
    "<span>ر.م</span><span>العملة</span><span>الوحدة</span><span>سعر الصرف الرسمي</span><span>سعر الصرف الموازي</span>";

  rowsContainer.innerHTML = "";
  data.forEach((item) => {
    const row = document.createElement("div");
    row.className = "table-row currency-row";
    row.innerHTML = `
      <span>${item.rank}</span>
      <span>${item.currency}</span>
      <span>${item.unit}</span>
      <span>${item.officialRate}</span>
      <span>${item.parallelRate}</span>
    `;
    rowsContainer.appendChild(row);
  });
}

function renderMarketRows(data) {
  headContainer.classList.remove("currency-head");
  headContainer.innerHTML = "<span>الأصل</span><span>السعر</span><span>التغير %</span><span>الحجم</span><span>الحالة</span>";

  rowsContainer.innerHTML = "";
  data.forEach((item) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <span>${item.asset}</span>
      <span>${item.price}</span>
      <span class="${item.change >= 0 ? "up" : "down"}">${item.change >= 0 ? "+" : ""}${item.change}%</span>
      <span>${item.volume}</span>
      <span><span class="status ${item.status === "مباشر" ? "live" : "watch"}">${item.status}</span></span>
    `;
    rowsContainer.appendChild(row);
  });
}

function renderTable() {
  const selected = marketData[activeSector];
  if (activeSector === "العملات") {
    renderCurrencyTable(selected);
    return;
  }

  renderMarketRows(selected);
}

function renderSummary() {
  const selectedAssets = marketData[activeSector];
  activeAssets.textContent = selectedAssets.length;

  if (activeSector === "العملات") {
    const avgOfficial =
      selectedAssets.reduce((acc, item) => acc + item.officialRate, 0) / selectedAssets.length;
    const avgParallel =
      selectedAssets.reduce((acc, item) => acc + item.parallelRate, 0) / selectedAssets.length;
    const avgSpread =
      selectedAssets.reduce((acc, item) => acc + ((item.parallelRate - item.officialRate) / item.officialRate) * 100, 0) /
      selectedAssets.length;

    winnersRatio.textContent = `${avgSpread.toFixed(2)}%`;
    totalVolume.textContent = avgOfficial.toFixed(3);
    volatility.textContent = avgParallel.toFixed(3);
    return;
  }

  const winners = selectedAssets.filter((item) => item.change >= 0).length;
  const ratio = Math.round((winners / selectedAssets.length) * 100);
  const volumeValue = selectedAssets.reduce((acc, item) => acc + parseVolumeToBillions(item.volume), 0);
  const averageVolatility = (
    selectedAssets.reduce((acc, item) => acc + Math.abs(item.change), 0) / selectedAssets.length
  ).toFixed(2);

  winnersRatio.textContent = `${ratio}%`;
  totalVolume.textContent = `$${volumeValue.toFixed(2)}B`;
  volatility.textContent = `${averageVolatility}%`;
}

async function refreshData() {
  const latestData = await loadMarketData();
  marketData = latestData;
  sectors = requiredSectors.filter((sector) => Array.isArray(marketData[sector]));
  if (!sectors.includes(activeSector)) {
    activeSector = sectors[0] || requiredSectors[0];
  }

  renderTabs();
  renderTable();
  renderSummary();
}

async function init() {
  if (!isDashboardPage()) {
    return;
  }

  await refreshData();
  setInterval(refreshData, REFRESH_INTERVAL_MS);
}

init();
