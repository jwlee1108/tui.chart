import Component from './component';
import { Rect, TreemapChartOptions } from '@t/options';
import { ChartState, ScaleData, Theme, TreemapSeriesData } from '@t/store/store';
import {
  TreemapRectModel,
  TreemapRectResponderModel,
  TreemapSeriesModels,
} from '@t/components/series';
import { BoundMap, squarify } from '@src/helpers/squarifier';
import { getRGBA, hexToRGB } from '@src/helpers/color';
import { TooltipData } from '@t/components/tooltip';
import { getDeepestNode } from '@src/helpers/responders';
import { getDataLabelsOptions } from '@src/helpers/dataLabels';
import { BOX_HOVER_THICKNESS } from '@src/helpers/boxStyle';
import { first, last } from '@src/helpers/utils';
import { getColorRatio, getSpectrumColor, makeDistances, RGB } from '@src/helpers/colorSpectrum';
import { RectDataLabel } from '@t/components/dataLabels';

export default class TreemapSeries extends Component {
  models: TreemapSeriesModels = { series: [], layer: [] };

  responders!: TreemapRectResponderModel[];

  activatedResponders: this['responders'] = [];

  zoomable!: boolean;

  initialize() {
    this.type = 'series';
    this.name = 'treemap';
  }

  private getAllChildSeries(series: TreemapSeriesData[], parentId: string) {
    const allChildSeries: TreemapSeriesData[] = [];

    series.forEach((data) => {
      if (data.parentId === parentId) {
        allChildSeries.push(data);
        if (data.hasChild) {
          const res = this.getAllChildSeries(series, data.id);
          allChildSeries.push(...res);
        }
      }
    });

    return allChildSeries;
  }

  render(chartState: ChartState<TreemapChartOptions>) {
    const { layout, treemapSeries, treemapScale, options, theme, treemapZoomId } = chartState;

    if (!treemapSeries.length) {
      throw new Error("There's no tree map data");
    }

    const currentTreemapZoomId = treemapZoomId.cur;
    const series = this.getAllChildSeries(treemapSeries, currentTreemapZoomId);

    this.rect = layout.plot;
    this.models = this.renderTreemapSeries(
      series,
      options,
      theme,
      treemapScale,
      currentTreemapZoomId
    );
    this.zoomable = options.series?.zoomable ?? false;

    if (getDataLabelsOptions(options, this.name).visible) {
      const useTreemapLeaf = options.series?.dataLabels?.useTreemapLeaf ?? false;
      const dataLabelModel = this.makeDataLabel(useTreemapLeaf, currentTreemapZoomId);

      this.renderDataLabels(dataLabelModel);
    }

    this.responders = this.makeTreemapSeriesResponder(currentTreemapZoomId);
  }

  makeTreemapSeriesResponder(treemapCurrentDepthParentId: string): TreemapRectResponderModel[] {
    const tooltipData: TooltipData[] = this.makeTooltipData();
    let { series } = this.models;

    if (this.zoomable) {
      series = series.filter(({ parentId }) => parentId === treemapCurrentDepthParentId);
    }

    return series.map<TreemapRectResponderModel>((m, idx) => ({
      ...m,
      data: tooltipData[idx],
      thickness: BOX_HOVER_THICKNESS,
      style: ['shadow'],
    }));
  }

  private makeTooltipData(): TooltipData[] {
    return this.models.series.map(({ label, data, color }) => ({
      label: label!,
      color,
      value: data as number,
    }));
  }

  makeBoundMap(
    series: TreemapSeriesData[],
    parentId: string,
    layout: Rect,
    boundMap: BoundMap = {}
  ) {
    const seriesItems = series.filter((item) => item.parentId === parentId);

    boundMap = { ...boundMap, ...squarify({ ...layout }, seriesItems) };

    seriesItems.forEach((seriesItem) => {
      boundMap = this.makeBoundMap(series, seriesItem.id, boundMap[seriesItem.id], boundMap);
    });

    return boundMap;
  }

  makeDataLabel(useTreemapLeaf: boolean, treemapCurrentDepthParentId: string): RectDataLabel[] {
    const series = useTreemapLeaf
      ? this.models.series.filter(({ hasChild }) => !hasChild)
      : this.models.series.filter(({ parentId }) => parentId === treemapCurrentDepthParentId);

    return series.map((m) => ({
      ...m,
      type: 'treemapSeriesName',
      value: m.label,
      direction: 'left',
      plot: { x: 0, y: 0, size: 0 },
    }));
  }

  getColor(treemapSeries: TreemapSeriesData, colors: string[]) {
    const { indexes } = treemapSeries;
    const colorIdx = first<number>(indexes)!;

    return colors[colorIdx];
  }

  getOpacity(treemapSeries: TreemapSeriesData) {
    const { indexes, depth } = treemapSeries;
    const idx = last<number>(indexes)!;

    return indexes.length === 1 ? 0 : Number((0.1 * depth + 0.05 * idx).toFixed(2));
  }

  renderTreemapSeries(
    seriesData: TreemapSeriesData[],
    options: TreemapChartOptions,
    theme: Theme,
    treemapScale: ScaleData,
    treemapCurrentDepthParentId: string
  ) {
    let layer: TreemapRectModel[] = [];
    const boundMap = this.makeBoundMap(seriesData, treemapCurrentDepthParentId, {
      ...this.rect,
      x: 0,
      y: 0,
    });

    const { colors, startColor, endColor } = theme.series;
    let startRGB, distances;
    const useColorValue = options.series?.useColorValue ?? false;
    if (useColorValue) {
      startRGB = hexToRGB(startColor) as RGB;
      distances = makeDistances(startRGB, hexToRGB(endColor) as RGB);
    }

    const series: TreemapRectModel[] = Object.keys(boundMap).map((id) => {
      const treemapSeries = seriesData.find((item) => item.id === id)!;
      let colorRatio;
      if (useColorValue) {
        colorRatio = getColorRatio(treemapScale.limit, treemapSeries.colorValue);
      }

      return {
        ...treemapSeries,
        ...boundMap[id],
        type: 'rect',
        colorRatio,
        color: useColorValue
          ? getSpectrumColor(colorRatio, distances, startRGB)
          : this.getColor(treemapSeries, colors),
        opacity: useColorValue ? 0 : this.getOpacity(treemapSeries),
      };
    });

    if (!options.series?.useColorValue) {
      layer = series.map((m) => ({ ...m, color: getRGBA('#000000', m.opacity!) }));
    }

    return { series, layer };
  }

  onClick({ responders }) {
    if (this.zoomable && responders[0]) {
      const { id, hasChild } = responders[0];

      if (hasChild) {
        this.emitMouseEvent([]);
        this.store.dispatch('setTreemapZoomId', id);
      }
    }
  }

  onMouseoutComponent() {
    this.emitMouseEvent([]);
  }

  onMousemove({ responders }) {
    const deepestNode = getDeepestNode(responders);
    this.activatedResponders = deepestNode;
    this.emitMouseEvent(deepestNode);
  }

  emitMouseEvent(responders: TreemapRectResponderModel[]) {
    this.eventBus.emit('renderHoveredSeries', {
      models: responders,
      name: this.name,
    });
    this.eventBus.emit('seriesPointHovered', {
      models: responders,
      name: this.name,
    });
    this.eventBus.emit('renderSpectrumTooltip', responders);
    this.eventBus.emit('needDraw');
  }
}