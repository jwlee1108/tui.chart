/**
 * @fileoverview Test for BarTypeSeriesBase
 * @author NHN Ent.
 *         FE Development Lab <dl_javascript@nhnent.com>
 */

'use strict';

var BarTypeSeriesBase = require('../../../src/js/components/series/barTypeSeriesBase.js'),
    SeriesDataModel = require('../../../src/js/models/data/seriesDataModel'),
    SeriesGroup = require('../../../src/js/models/data/seriesGroup'),
    dom = require('../../../src/js/helpers/domHandler.js'),
    renderUtil = require('../../../src/js/helpers/renderUtil.js');

describe('BarTypeSeriesBase', function() {
    var series, dataProcessor;

    beforeAll(function() {
        // 브라우저마다 렌더된 너비, 높이 계산이 다르기 때문에 일관된 결과가 나오도록 처리함
        spyOn(renderUtil, 'getRenderedLabelWidth').and.returnValue(40);
        spyOn(renderUtil, 'getRenderedLabelHeight').and.returnValue(20);
    });

    beforeEach(function() {
        series = new BarTypeSeriesBase();
        series.theme = {
            label: {
                fontFamily: 'Verdana',
                fontSize: 11
            }
        };

        dataProcessor = jasmine.createSpyObj('dataProcessor',
            ['getFormatFunctions', 'getFirstItemLabel', 'getFormattedValue']);

        dataProcessor.getFormatFunctions.and.returnValue([]);

        series.dataProcessor = dataProcessor;
        series._makeSeriesRenderingPosition = jasmine.createSpy('_makeSeriesRenderingPosition').and.returnValue({
            left: 0,
            top: 0
        });
        series._makeSeriesLabelHtml = jasmine.createSpy('_makeSeriesLabelHtml').and.returnValue('<div></div>');;
        series._makePlusSumLabelHtml = jasmine.createSpy('_makePlusSumLabelHtml').and.returnValue('<div></div>');;
        series._makeMinusSumLabelHtml = jasmine.createSpy('_makeMinusSumLabelHtml').and.returnValue('<div></div>');;
        series._getSeriesDataModel = jasmine.createSpy('_getSeriesDataModel');
    });

    describe('_makeBarGutter()', function() {
        it('계산되는 bar의 사이즈(group bar 너비 / (itemCount + 1) / 2)가 2보다 작거나 같다면 bar gutter(bar와 bar 사이의 간격)은 0입니다.', function() {
            var actual = series._makeBarGutter(20, 5),
                expected = 0;
            expect(actual).toBe(expected);
        });

        it('계산되는 bar의 사이즈가 2보다 크고 6보다 작거나 같다면 bar gutter는 2입니다.', function() {
            var actual = series._makeBarGutter(60, 5),
                expected = 2;
            expect(actual).toBe(expected);
        });

        it('계산되는 bar의 사이즈가 6보다 크다면 bar gutter는 4입니다.', function() {
            var actual = series._makeBarGutter(100, 5),
                expected = 4;
            expect(actual).toBe(expected);
        });
    });

    describe('_calculateBarSize()', function() {
        it('bar size는 bar group size에서 간격정보를 빼고 아이템수 + 1로 나누어 계산됩니다.', function() {
            var actual = series._calculateBarSize(100, 4, 5),
                expected = 14;
            expect(actual).toBe(expected);
        });
    });

    describe('_getBarWidthOptionSize()', function() {
        it('optionBarWidth(옵션값,두번째인자)가 barSize(첫번째 인자)보다 작을 경우에는 옵션 값을 반환합니다.', function() {
            var actual = series._getBarWidthOptionSize(14, 10),
                expected = 10;
            expect(actual).toBe(expected);
        });

        it('optionBarWidth가 barSize보다 클 경우에는 barSize를 반환합니다.', function() {
            var actual = series._getBarWidthOptionSize(14, 20),
                expected = 14;
            expect(actual).toBe(expected);
        });
    });

    describe('_calculateAdditionalPosition()', function() {
        it('시리즈 양쪽 사이드 영역의 추가적인 position값을 구합니다. 옵션이 없을 경우에는 0을 반환합니다.', function() {
            var actual = series._calculateAdditionalPosition(14);
            var expected = 0;

            expect(actual).toBe(expected);
        });

        it('optionsSize(두번째인자) 값이 있으면서 barSize보다 작으면 barSize(첫번째인자)을 반으로 나눈 값에 barSize와의 차를 itemCount(세번째인자)로 곱하고 2로 나눈 값을 더하여 반환합니다.', function() {
            var actual = series._calculateAdditionalPosition(14, 10, 4);
            var expected = 15;
            expect(actual).toBe(expected);
        });
    });

    describe('_makeBaseDataForMakingBound()', function() {
        it('바, 컬럼 차트의 bound를 계산하기 위한 baseData를 생성합니다.', function() {
            var baseGroupSize = 100;
            var baseBarSize = 100;
            var seriesDataModel = new SeriesDataModel();
            var actual, expected;

            series._getSeriesDataModel.and.returnValue(seriesDataModel);

            seriesDataModel.groups = [
                new SeriesGroup([{
                    value: 10
                }, {
                    value: 20
                }])
            ];

            series.options = {};
            series.data = {
                limit: {
                    min: 0,
                    max: 80
                }
            };

            series._getLimitDistanceFromZeroPoint = jasmine.createSpy('_getLimitDistanceFromZeroPoint').and.returnValue({
                toMin: 0
            });

            actual = series._makeBaseDataForMakingBound(baseGroupSize, baseBarSize);
            expected = {
                baseBarSize: 100,
                groupSize: 100,
                barSize: 32,
                step: 36,
                firstAdditionalPosition: 16,
                additionalPosition: 0,
                basePosition: 0
            };

            expect(actual).toEqual(expected);
        });
    });

    describe('_renderNormalSeriesLabel()', function() {
        it('bar type(bar, column) 일반(normal) 차트의 series label을 전달하는 values의 수만큼 랜더링 합니다.', function() {
            var labelContainer = dom.create('div');
            var seriesDataModel = new SeriesDataModel();

            dataProcessor.getFirstItemLabel.and.returnValue('1.5');
            series._getSeriesDataModel.and.returnValue(seriesDataModel);
            seriesDataModel.groups = [
                new SeriesGroup([{
                    value: 1.5,
                    endLabel: '1.5'
                }, {
                    value: 2.2,
                    endLabel: '2.2'
                }])
            ];

            series.seriesData = {
                groupBounds: [
                    [
                        {
                            end: {}
                        },
                        {
                            end: {}
                        }
                    ]
                ]
            };
            series._renderNormalSeriesLabel(labelContainer);

            expect(labelContainer.childNodes.length).toEqual(2);
        });
    });

    describe('_makeSumValues()', function() {
        it('[10, 20, 30] values의 합은 60입니다.', function() {
            var actual = series._makeSumValues([10, 20, 30]);
            expect(actual).toBe('60');
        });

        it('두번째 인자에 포맷팅 함수 배열을 넘기면 합한 결과를 전달한 함수 배열들로 포맷팅 하여 반환합니다.', function() {
            var actual;

            dataProcessor.getFormatFunctions.and.returnValue([function(value) { return '00' + value; }]);

            actual = series._makeSumValues([10, 20, 30]);
            expect(actual).toBe('0060');
        });
    });

    describe('_makeStackedLabelsHtml()', function() {
        it('bar type(bar, column) stack 차트의 series label html을 전달하는 values의 수 만큼 생성합니다.', function() {
            var container = dom.create('div');
            var html;
            series.options = {
                stackType: 'percent'
            };

            html = series._makeStackedLabelsHtml({
                seriesGroup: new SeriesGroup([{
                    value: 1.5,
                    label: '1.5'
                }, {
                    value: 2.2,
                    label: '2.2'
                }]),
                bounds: [
                    {
                        end: {}
                    },
                    {
                        end: {}
                    }
                ],
                labelHeight: 10
            });
            container.innerHTML = html;
            expect(container.childNodes.length).toBe(2);
        });

        it('stackType옵션이 normal일 경우에는 series label html을 전달하는 values + 1(sum)만큼 생성합니다.', function() {
            var container = dom.create('div');
            var html;

            series.options = {
                stackType: 'normal'
            };

            html = series._makeStackedLabelsHtml({
                seriesGroup: new SeriesGroup([{
                    value: 1.5,
                    label: '1.5'
                }, {
                    value: 2.2,
                    label: '2.2'
                }]),
                bounds: [
                    {
                        end: {}
                    },
                    {
                        end: {}
                    }
                ],
                labelHeight: 10
            });
            container.innerHTML = html;
            expect(container.childNodes.length).toBe(4);
        });
    });

    describe('_renderStackedSeriesLabel()', function() {
        it('bar type(bar, column) stackType=normal 차트의 series label을 전달하는 values의 수 + 1(sum)만큼 랜더링 합니다.', function() {
            var elLabelArea = dom.create('div');
            var seriesDataModel = new SeriesDataModel();

            dataProcessor.getFirstItemLabel.and.returnValue('1.5');
            series._getSeriesDataModel.and.returnValue(seriesDataModel);
            seriesDataModel.groups = [
                new SeriesGroup([{
                    value: 1.5
                }, {
                    value: 2.2
                }])
            ];

            series.options = {
                stackType: 'normal'
            };
            series.seriesData = {
                groupBounds: [
                    [
                        {
                            end: {}
                        },
                        {
                            end: {}
                        }
                    ]
                ]
            };
            series._renderStackedSeriesLabel(elLabelArea);

            expect(elLabelArea.childNodes.length).toBe(4);
        });
    });

    describe('_renderSeriesLabel()', function() {
        it('stackType 옵션이 없으면 _renderNormalSeriesLabel()이 수행됩니다.', function() {
            var elLabelArea = dom.create('div');
            var elExpected = dom.create('div');
            var seriesDataModel = new SeriesDataModel();

            series._getSeriesDataModel.and.returnValue(seriesDataModel);
            seriesDataModel.groups = [
                new SeriesGroup([{
                    value: -1.5,
                    label: '-1.5'
                }, {
                    value: -2.2,
                    label: '-2.2'
                }])
            ];

            series.options = {};
            series.seriesData = {
                groupBounds: [
                    [
                        {
                            end: {}
                        },
                        {
                            end: {}
                        }
                    ]
                ]
            };

            series._renderSeriesLabel(elLabelArea);
            series._renderNormalSeriesLabel(elExpected);

            expect(elLabelArea.className).toEqual(elExpected.className);
            expect(elLabelArea.innerHTML).toEqual(elExpected.innerHTML);
        });

        it('stackType 옵션이 있으면 _renderStackedSeriesLabel()이 수행됩니다.', function() {
            var elLabelArea = dom.create('div');
            var elExpected = dom.create('div');
            var seriesDataModel = new SeriesDataModel();

            series._getSeriesDataModel.and.returnValue(seriesDataModel);
            seriesDataModel.groups = [
                new SeriesGroup([{
                    value: -1.5,
                    label: '-1.5'
                }, {
                    value: -2.2,
                    label: '-2.2'
                }])
            ];

            series.options = {
                stackType: 'normal'
            };
            series.seriesData = {
                groupBounds: [
                    [
                        {
                            end: {}
                        },
                        {
                            end: {}
                        }
                    ]
                ]
            };

            series._renderSeriesLabel(elLabelArea);
            series._renderStackedSeriesLabel(elExpected);

            expect(elLabelArea.className).toEqual(elExpected.className);
            expect(elLabelArea.innerHTML).toEqual(elExpected.innerHTML);
        });
    });
});