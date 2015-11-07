angular.module('MapDrawer').factory('PlayerServive', ['MapPlayerDrawer', 'SocketClient', function (MapPlayerDrawer, SocketClient) {
    'use strict';

    var playerPosition = {
        x: 0,
        y: 0
    };
    var playerLimits = {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
    };
    var isActive = false;
    var currentMap = null;
    var currentCellSize = null;
    var REPRESS_TIME = 500;
    var throttledRegisterPlayerMovement = _.throttle(function (keyCode) {
        registerPlayerMovement(keyCode);
    }, REPRESS_TIME);

    function convertPlayerPositionToWorldPosition(cellSize) {
        var lowestPositionOnMap = currentMap[0][0];
        var xOrigin = (Math.abs(lowestPositionOnMap.x) * cellSize) + (cellSize / 2);
        var yOrigin = (Math.abs(lowestPositionOnMap.y) * cellSize) + (cellSize / 2);

        return {
            x: xOrigin + (playerPosition.x * cellSize),
            y: yOrigin - (playerPosition.y * cellSize)
        };
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    function registerPlayerMovement(keyCode) {
        switch (keyCode) {
            case 37:
                playerPosition.x--;
                break;
            case 38:
                playerPosition.y++;
                break;
            case 39:
                playerPosition.x++;
                break;
            case 40:
                playerPosition.y--;
                break;
        }
        // limit player position
        playerPosition.x = clamp(playerPosition.x, playerLimits.minX, playerLimits.maxX);
        playerPosition.y = clamp(playerPosition.y, playerLimits.minY, playerLimits.maxY);

        move(currentCellSize);

        SocketClient.requestPosition(playerPosition.x, playerPosition.y);
    }

    function move(cellSize) {
        if (!angular.isNumber(cellSize)) {
            throw new Error('cellSize is mandatory and must be a {Number}');
        }
        var worldPosition = convertPlayerPositionToWorldPosition(cellSize);
        MapPlayerDrawer.move(worldPosition.x, worldPosition.y);
    }

    function draw(layer) {
        MapPlayerDrawer.draw(layer);
    }

    /***** Controls *****/
    function onKeyDown() {
        var keyCode = d3.event.keyCode;
        throttledRegisterPlayerMovement(keyCode);
    }

    function enablePlayerControls() {
        if (!isActive) {
            d3.select('body').on('keydown', onKeyDown);
            isActive = true;
        }
    }

    function disablePlayerControls() {
        d3.select('body').off('keydown', onKeyDown);
    }
    /*********************/

    function updatePlayerPositionLimits() {
        var firstRow = currentMap[0];
        var lastRow = currentMap[currentMap.length - 1];
        playerLimits.minX = lastRow[0].x;
        playerLimits.minY = lastRow[0].y;
        playerLimits.maxX = firstRow[firstRow.length - 1].x;
        playerLimits.maxY = firstRow[firstRow.length - 1].y;
    }

    function setCurrentMap(map) {
        currentMap = map;
        updatePlayerPositionLimits();
    }

    function setCurrentCellSize(cellSize) {
        currentCellSize = cellSize;
    }

    function getCurrentPosition() {
        return {
            x: playerPosition.x,
            y: playerPosition.y
        };
    }

    return {
        enablePlayerControls: enablePlayerControls,
        disablePlayerControls: disablePlayerControls,
        draw: draw,
        move: move,
        setCurrentMap: setCurrentMap,
        setCurrentCellSize: setCurrentCellSize,
        getCurrentPosition: getCurrentPosition
    };

}]);
