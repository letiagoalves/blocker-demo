angular.module('MapDrawer').factory('MapPlayerDrawer', ['$rootScope', function ($rootScope) {
    'use strict';

    var player;
    var playerSize = 16;

    function draw(playerLayer) {
        player = playerLayer
            .append('svg:circle')
            .attr('class', 'player')
            .attr('r', playerSize)
            .style('fill', 'orange');
    }

    function move(x, y) {
        player.transition()
            .attr('cx', x)
            .attr('cy', y);

        $rootScope.$broadcast('MapPlayerDrawer.move', {
            x: x,
            y: y
        });
    }

    return {
        draw: draw,
        move: move
    };
}]);
