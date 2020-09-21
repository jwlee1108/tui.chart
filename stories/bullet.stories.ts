import BulletChart from '@src/charts/bulletChart';
import { BulletSeriesData, BulletChartOptions } from '@t/options';
import { deepMergedCopy } from '@src/helpers/utils';
import { budgetDataForBullet } from './data';

const budgetData = budgetDataForBullet as BulletSeriesData;

export default {
  title: 'chart|Bullet',
};

const defaultOptions = {
  chart: {
    width: 1160,
    height: 500,
    title: 'Monthly Revenue',
  },
};

function createChart(data: BulletSeriesData, customOptions?: BulletChartOptions) {
  const el = document.createElement('div');
  const options = deepMergedCopy(defaultOptions, customOptions || {});

  el.style.outline = '1px solid red';
  el.style.width = `${options.chart.width}px`;
  el.style.height = `${options.chart.height}px`;

  const chart = new BulletChart({ el, data, options });

  return { el, chart };
}

export const basic = () => {
  const { el } = createChart(budgetData);

  return el;
};

export const vertical = () => {
  const { el } = createChart(budgetData, {
    series: {
      vertical: true,
    },
  });

  return el;
};

export const selecatable = () => {
  const { el } = createChart(budgetData, {
    series: {
      selectable: true,
    },
  });

  return el;
};

export const dataLabels = () => {
  const { el } = createChart(budgetData, {
    series: {
      dataLabels: {
        visible: true,
      },
    },
  });

  return el;
};