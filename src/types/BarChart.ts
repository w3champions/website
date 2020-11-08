import { ChartOptions } from 'chart.js';

export const DefaultOptions: ChartOptions = {
    legend: {
      display: true,
    },
    tooltips: {
      bodyAlign: "center",
      custom: function (tooltip: { displayColors: boolean }) {
        if (!tooltip) return;
        tooltip.displayColors = false;
      },
      callbacks: {
        label: function (tooltipItem: { xLabel: any; yLabel: any }) {
          return `${tooltipItem.xLabel} - ${tooltipItem.yLabel}`;
        },
        title: function () {
          return "";
        },
      },
    },
    maintainAspectRatio: false,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      xAxes: [
        {
          ticks: {
            reverse: false,
          },
        },
      ],
    },
  };