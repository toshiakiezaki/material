'use strict';

angular.module('material.components.table').directive('mdRow', function() {

  function compile(tElement) {
    tElement.addClass('md-row');
    return postLink;
  }

  function postLink(scope, element, attrs, tableCtrl) {
    function enableRowSelection() {
      return tableCtrl.$$rowSelect;
    }

    function isBodyRow() {
      return tableCtrl.getBodyRows().indexOf(element[0]) !== -1;
    }

    function isChild(node) {
      return element[0].contains(node[0]);
    }

    if(isBodyRow()) {
      var cell = angular.element('<md-cell class="md-cell">');

      scope.$watch(enableRowSelection, function (enable) {
        // if a row is not selectable, prepend an empty cell to it
        if(enable && !attrs.mdSelect) {
          if(!isChild(cell)) {
            element.prepend(cell);
          }
          return;
        }

        if(isChild(cell)) {
          cell.remove();
        }
      });
    }
  }

  return {
    compile: compile,
    require: '^^mdTable',
    restrict: 'E'
  };
});