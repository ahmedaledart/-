const rateRows = document.querySelectorAll(".rate-row");
const refreshButton = document.getElementById("refreshRates");
const searchInput = document.getElementById("rateSearch");

const formatRate = (value) => value.toFixed(2);

const updateRates = () => {
  rateRows.forEach((row) => {
    const trend = row.querySelector(".trend");
    const bid = row.querySelector(".bid");
    const ask = row.querySelector(".ask");
    const base = Number(row.dataset.base || bid.textContent);
    const current = Number(row.dataset.current || base);
    const drift = (Math.random() - 0.5) * 0.012;
    const next = Math.max(0.01, current * (1 + drift));
    const change = next - base;

    row.dataset.current = next.toString();
    bid.textContent = formatRate(next - 0.02);
    ask.textContent = formatRate(next + 0.02);

    trend.textContent = change > 0 ? "▲" : change < 0 ? "▼" : "—";
    trend.classList.toggle("up", change > 0);
    trend.classList.toggle("down", change < 0);
    trend.classList.toggle("stable", change === 0);

    row.classList.add("updated");
    setTimeout(() => row.classList.remove("updated"), 600);
  });
};

if (refreshButton) {
  refreshButton.addEventListener("click", updateRates);
}

if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim();
    rateRows.forEach((row) => {
      const text = row.textContent;
      row.style.display = text.includes(query) ? "" : "none";
    });
  });
}

updateRates();
