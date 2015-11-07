angular.module('Main', []);

angular.module('Main').controller('MainController', [
    '$scope',
    'SocketClient',
    function ($scope, SocketClient) {
        'use strict';

        // TODO: view memory leaks: 187 MB?!

        var context = this;

        function buildInfo(map) {
            var width = map[0].length;
            var height = map.length;
            var blocks = {};
            var totalBlocks = 0;

            map.forEach(function (column) {
                column.forEach(function (worldPosition) {
                    var blockId = worldPosition.block;
                    if (blockId) {
                        blocks[blockId] = blocks[blockId] || 0;
                        ++blocks[blockId];
                        ++totalBlocks;
                    }
                });
            });

            return {
                width: width,
                height: height,
                blocks: blocks,
                totalBlocks: totalBlocks
            };
        }

        function drawFn(map) {
            $scope.$apply(function () {
                context.data.map = map;
                context.data.info = buildInfo(map);
            });
        }

        context.data = {
            map: null,
            info: null
        };

        SocketClient.init(drawFn);
    }
]);

angular.module('Main').factory('SocketClient', [function () {
    'use strict';

    var socket;
    var port = getParameterByName('port') || 80;
    var path = 'http://localhost:' + port;
    var EVENTS = {
        PARTIAL_MAP: 'PARTIAL_MAP',
        MAP: 'MAP',
        MAP_UPDATED: 'MAP_UPDATED'
    };

    function getParameterByName(name) {
        var regex;
        var results;

        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        results = regex.exec(location.search);

        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    /*
    function requestPosition (posX, posY) {
        var size = 1;
        socket.emit(EVENTS.PARTIAL_MAP, {
            minX: posX - size,
            minY: posY - size,
            maxX: posX + size,
            maxY: posY + size
        });
    }
    */
    function requestPosition(posX, posY) {
        socket.emit(EVENTS.PARTIAL_MAP, {
            x: posX,
            y: posY
        });
    }

    function init(drawFn) {
        if (!angular.isFunction(drawFn)) {
            throw new Error('drawFn is mandatory and must be a {Function}');
        }

        socket = io.connect(path, {
            'force new connection': true
        });

        socket.on('connect', function () {
            socket.on(EVENTS.MAP, function (data) {
                console.log('on EVENTS.MAP');
                drawFn(data);
            });
            socket.on(EVENTS.PARTIAL_MAP, function (data) {
                // request all map
                socket.emit(EVENTS.MAP);
            });
            socket.on(EVENTS.MAP_UPDATED, function (data) {
                console.log('on EVENTS.MAP_UPDATED');
                drawFn(data);
            }); // request map for first time
            socket.emit(EVENTS.MAP);
        });
    }
    return {
        init: init,
        requestPosition: requestPosition
    };
}]);



angular.module('Main').factory('MainService', [function () {
    return {};

}]);
