'use strict';

angular.module('material.components.table').directive('mdTableProgress', function() {

  function postLink(scope, element, attrs, tableCtrl) {
    scope.columnCount = tableCtrl.columnCount;
    scope.deferred = tableCtrl.waitingOnPromise;
  }

  return {
    link: postLink,
    require: '^^mdTable',
    restrict: 'C',
    templateUrl: 'md-table-progress.html'
  };
});