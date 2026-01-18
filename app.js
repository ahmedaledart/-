const sparklines = document.querySelectorAll(".sparkline");

sparklines.forEach((sparkline) => {
  const values = sparkline.dataset.values.split(",").map((value) => Number(value));
  const max = Math.max(...values);

  values.forEach((value) => {
    const bar = document.createElement("span");
    bar.style.height = `${(value / max) * 100}%`;
    sparkline.appendChild(bar);
  });
});
