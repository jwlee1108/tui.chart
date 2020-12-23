import Chart, { AddSeriesDataInfo, SelectSeriesInfo } from './chart';
import {
  ColumnLineData,
  ColumnLineChartOptions,
  Point,
  LineSeriesDataType,
  BoxSeriesDataType,
  PlotBand,
  PlotLine,
} from '@t/options';
import { RawSeries } from '@t/store/store';
import stackSeriesData from '@src/store/stackSeriesData';
import plot from '@src/store/plot';
import axes from '@src/store/axes';
import scale from '@src/store/scale';
import dataRange from '@src/store/dataRange';

import Legend from '@src/component/legend';
import BoxStackSeries from '@src/component/boxStackSeries';
import BoxSeries from '@src/component/boxSeries';
import LineSeries from '@src/component/lineSeries';
import Plot from '@src/component/plot';
import Title from '@src/component/title';
import ZeroAxis from '@src/component/zeroAxis';
import Axis from '@src/component/axis';
import AxisTitle from '@src/component/axisTitle';
import ExportMenu from '@src/component/exportMenu';
import SelectedSeries from '@src/component/selectedSeries';
import HoveredSeries from '@src/component/hoveredSeries';
import DataLabels from '@src/component/dataLabels';
import Tooltip from '@src/component/tooltip';

import * as basicBrush from '@src/brushes/basic';
import * as axisBrush from '@src/brushes/axis';
import * as legendBrush from '@src/brushes/legend';
import * as labelBrush from '@src/brushes/label';
import * as exportMenuBrush from '@src/brushes/exportMenu';
import * as dataLabelBrush from '@src/brushes/dataLabel';
import * as lineSeriesBrush from '@src/brushes/lineSeries';

import { isExist } from '@src/helpers/utils';
import { RespondersModel } from '@t/components/series';

export interface ColumnLineChartProps {
  el: HTMLElement;
  options: ColumnLineChartOptions;
  data: ColumnLineData;
}

function hasPointEventType(respondersModel: RespondersModel, name: string) {
  return respondersModel.find(
    ({ component }) =>
      component.name === name && (component as BoxSeries | LineSeries).eventDetectType === 'point'
  );
}
function hasColumnLineUsingPointEventType(respondersModel: RespondersModel) {
  return (
    isExist(hasPointEventType(respondersModel, 'column')) &&
    isExist(hasPointEventType(respondersModel, 'line'))
  );
}

export default class ColumnLineChart extends Chart<ColumnLineChartOptions> {
  modules = [stackSeriesData, dataRange, scale, axes, plot];

  constructor({ el, options, data: { series, categories } }: ColumnLineChartProps) {
    super({
      el,
      options,
      series: series as RawSeries,
      categories,
    });
  }

  initialize() {
    super.initialize();

    this.componentManager.add(Title);
    this.componentManager.add(Plot);
    this.componentManager.add(Legend);
    this.componentManager.add(BoxStackSeries, { name: 'column' });
    this.componentManager.add(BoxSeries, { name: 'column' });
    this.componentManager.add(LineSeries);
    this.componentManager.add(ZeroAxis);
    this.componentManager.add(Axis, { name: 'xAxis' });
    this.componentManager.add(Axis, { name: 'yAxis' });
    this.componentManager.add(Axis, { name: 'secondaryYAxis' });
    this.componentManager.add(AxisTitle, { name: 'xAxis' });
    this.componentManager.add(AxisTitle, { name: 'yAxis' });
    this.componentManager.add(AxisTitle, { name: 'secondaryYAxis' });
    this.componentManager.add(ExportMenu, { chartEl: this.el });
    this.componentManager.add(HoveredSeries);
    this.componentManager.add(SelectedSeries);
    this.componentManager.add(DataLabels);
    this.componentManager.add(Tooltip, { chartEl: this.el });

    this.painter.addGroups([
      basicBrush,
      axisBrush,
      legendBrush,
      labelBrush,
      exportMenuBrush,
      dataLabelBrush,
      lineSeriesBrush,
    ]);
  }

  handleEventForAllResponders(
    event: MouseEvent,
    responderModels: RespondersModel,
    delegationMethod: string,
    mousePosition: Point
  ) {
    if (hasColumnLineUsingPointEventType(responderModels)) {
      const columnSeries = responderModels.find(({ component }) => component.name === 'column')!;

      columnSeries.component[delegationMethod]({ mousePosition, responders: [] }, event);
    }
  }

  public addData = (
    data: BoxSeriesDataType[] | LineSeriesDataType[],
    category: string,
    chartType: 'line' | 'column'
  ) => {
    this.animationControlFlag.updating = true;
    this.store.dispatch('addData', { data, category, chartType });
  };

  public addSeries(data, dataInfo: AddSeriesDataInfo) {
    this.store.dispatch('addSeries', { data, ...dataInfo });
  }

  public setData(data: ColumnLineData) {
    this.store.dispatch('setData', data);
  }

  public addPlotLine(data: PlotLine) {
    this.store.dispatch('addPlotLine', { data });
  }

  public removePlotLine(id: string) {
    this.store.dispatch('removePlotLine', { id });
  }

  public addPlotBand(data: PlotBand) {
    this.store.dispatch('addPlotBand', { data });
  }

  public removePlotBand(id: string) {
    this.store.dispatch('removePlotBand', { id });
  }

  public hideSeriesLabel = () => {
    this.store.dispatch('updateOptions', { series: { dataLabels: { visible: false } } });
  };

  public showSeriesLabel = () => {
    this.store.dispatch('updateOptions', { series: { dataLabels: { visible: true } } });
  };

  public setOptions = (options: ColumnLineChartOptions) => {
    this.dispatchOptionsEvent('initOptions', options);
  };

  public updateOptions = (options: ColumnLineChartOptions) => {
    this.dispatchOptionsEvent('updateOptions', options);
  };

  /**
   * Show tooltip.
   * @param {Object} seriesInfo - Information of the series for the tooltip to be displayed.
   *      @param {number} seriesInfo.seriesIndex - Index of series.
   *      @param {number} seriesInfo.index - Index of data within series.
   *      @param {string} seriesInfo.chartType - specify which chart to select.
   * @api
   * @example
   * chart.showTooltip({index: 1, seriesIndex: 2, chartType: 'column'});
   */
  public showTooltip = (seriesInfo: SelectSeriesInfo) => {
    this.eventBus.emit('showTooltip', { ...seriesInfo });
  };

  /**
   * Hide tooltip.
   * @api
   * @example
   * chart.hideTooltip();
   */
  public hideTooltip = () => {
    this.eventBus.emit('hideTooltip');
  };
}