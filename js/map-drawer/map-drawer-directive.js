angular.module('MapDrawer').directive('mapDrawer', ['$interval', 'PlayerServive', function ($interval, PlayerServive) {
    'use strict';

    var elementSize;
    var playerWasDrawn = false;
    var GRID_MIN_SIZE = 400;
    var CELL_SIZE = 60;

    function getVisibleBoundaries(playerPosition) {
        var playerVisibilityDistance = 2;
        var visibleBoundaries = {
            minX: playerPosition.x - 2,
            minY: playerPosition.y - 2,
            maxX: playerPosition.x + 2,
            maxY: playerPosition.y + 2
        };
        return visibleBoundaries;
    }

    function buildData(data, cellSize) {
        return data.map(function (arr, columnIndex) {
            return arr.map(function (value, rowIndex) {
                var valueStr;

                if (value.block === undefined) {
                    valueStr = 'empty';
                } else if (value.block === null) {
                    valueStr = 'no-match';
                } else {
                    valueStr = value.block;
                }
                return {
                    mapX: value.x,
                    mapY: value.y,
                    x: rowIndex * cellSize,
                    y: columnIndex * cellSize,
                    value: valueStr
                };
            });
        });
    }

    function lazyFn(d) {
        return d;
    }

    function getUniqueId(val) {
        return [val.value, val.x, val.y].join('_');
    }

    function drawMap(mapLayer, map, cellSize) {
        var rows = mapLayer.selectAll('.row').data(map);

        rows.enter()
            .append('svg:g')
            .attr('class', 'row');

        var cells = rows.selectAll('.cell').data(lazyFn);

        cells.enter()
            .append('svg:image')
            .attr('class', 'cell')
            .attr('width', cellSize)
            .attr('height', cellSize);

        cells.exit().remove();

        cells.attr('x', function (d) {
            return d.x;
        }).attr('y', function (d) {
            return d.y;
        }).attr('xlink:href', function (d) {
            return 'img/tiles/{value}.png'.replace('{value}', d.value);
        });
    }

    function updateMapVisibility(mapLayer, visibleBoundaries) {
        var cells = mapLayer.selectAll('.cell');
        cells.attr('opacity', function (d) {
            var isVisible = d.mapX > visibleBoundaries.minX && d.mapX < visibleBoundaries.maxX && d.mapY > visibleBoundaries.minY && d.mapY < visibleBoundaries.maxY;

            return isVisible ? 1 : 0.5;
        });
    }

    function getNumberOfGridColumns(matrix) {
        return matrix[0].length;
    }

    function calculateAvailableGridSpace(element) {
        var parentElement = element.parent();
        var parentWidth = parentElement.prop('offsetWidth');
        var parentHeight = parentElement.prop('offsetHeight');
        var elementSize = Math.min(parentWidth, parentHeight);

        return elementSize;
    }

    function updateMainSvg(element, mainSvg, map, cellSize) {
        var gridAvailableSpace = calculateAvailableGridSpace(element);
        var gridWidth = getNumberOfGridColumns(map) * cellSize;
        var gridHeight = map.length * cellSize;
        var gridSize = Math.min(gridAvailableSpace, Math.max(gridWidth, gridHeight));
        var viewBoxAttribute;

        // borders
        //gridWidth += 2;
        //gridHeight += 2;

        viewBoxAttribute = [0, 0, gridWidth, gridHeight].join(' ');

        mainSvg
            .attr('width', gridSize)
            .attr('height', gridSize)
            .attr('viewBox', viewBoxAttribute);
    }

    function mapWatch(element, mainSvg, mapLayer, playerLayer, newMap) {
        var mapData;
        var gridSize;
        var playerCurrentPosition;
        var visibleBoundaries;

        if (angular.isObject(newMap)) {
            updateMainSvg(element, mainSvg, newMap, CELL_SIZE);

            mapData = buildData(newMap, CELL_SIZE);
            drawMap(mapLayer, mapData, CELL_SIZE);
            playerCurrentPosition = PlayerServive.getCurrentPosition();
            visibleBoundaries = getVisibleBoundaries(playerCurrentPosition);
            updateMapVisibility(mapLayer, visibleBoundaries);

            /***** Player ******/
            PlayerServive.setCurrentMap(newMap);
            PlayerServive.setCurrentCellSize(CELL_SIZE);
            if (!playerWasDrawn) {
                PlayerServive.draw(playerLayer);
                PlayerServive.enablePlayerControls();
                playerWasDrawn = true;
            }
            PlayerServive.move(CELL_SIZE);
            /*******************/
        }
    }

    return {
        restrict: 'A',
        scope: {
            map: '='
        },
        link: function (scope, element) {
            var elementNode = element[0];
            var mainSvg = d3.select(elementNode).append('svg');
            var mapLayer = mainSvg.append('svg:g');
            var playerLayer = mainSvg.append('svg:g');

            scope.$watch('map', function (newMap) {
                mapWatch(element, mainSvg, mapLayer, playerLayer, newMap);
            }, true);

            scope.$on('MapPlayerDrawer.move', function onPlayerMove() {
                var playerCurrentPosition = PlayerServive.getCurrentPosition();
                var visibleBoundaries = getVisibleBoundaries(playerCurrentPosition);
                updateMapVisibility(mapLayer, visibleBoundaries);
            });
        }
    };

}]);
