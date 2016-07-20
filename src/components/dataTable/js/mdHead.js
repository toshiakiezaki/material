angular.module('material.components.table').directive('mdHead', ['$compile', function($compile) {

  function controller() {
  }

  function link($scope, $element, $attrs, $ctrls) {
    var self          = $ctrls[0],
        table         = $ctrls[1],
        find          = table.find,
        item          = table.item,
        jqLite        = angular.element,
        watchListener;

    var CHECKBOX = '<md-checkbox aria-label="Select All" ng-click="$mdHead.toggleAll()" ng-checked="$mdHead.allSelected()" ng-disabled="!$mdHead.getSelectableRows().length"></md-checkbox>';

    function isMultiple() {
      return table.multiple;
    };

    function appendCheckbox() {
      jqLite(self.rows(-1).children[0]).append($compile(CHECKBOX)($scope));
    };

    function removeCheckbox() {
      var cell = find(self.rows(-1).children, function (cell) {
        return cell.classList.contains('md-checkbox-cell');
      });

      if(cell && cell.firstChild) {
        cell.removeChild(cell.firstChild);
      }
    };

    function mdSelectCtrl(row) {
      return angular.element(row).controller('mdSelect');
    };

    self.rows = function (index) {
      return isNaN(index) ? $element.children() : item($element.children(), index);
    };

    self.allSelected = function () {
      var rows = self.getSelectableRows();

      return rows.length && rows.every(function (row) {
        return row.isSelected;
      });
    };

    self.getSelectableRows = function () {
      var rows = table.tBodies.reduce(function (rows, body) {
        return rows.concat(Array.prototype.filter.call(body.children, function (row) {
          return !row.classList.contains('ng-leave');
        }));
      }, []);

      return rows.map(mdSelectCtrl).filter(function (row) {
        return row && !row.disabled;
      });
    };

    self.selectAll = function () {
      self.getSelectableRows().forEach(function (row) {
        if(!row.isSelected) {
          row.select();
        }
      });
    };

    self.unSelectAll = function () {
      self.getSelectableRows().forEach(function (row) {
        row.deselect();
      });
    };

    self.toggleAll = function () {
      return self.allSelected() ? self.unSelectAll() : self.selectAll();
    };

    self.onEnableSelection = function () {
      if(watchListener) {
        return;
      }

      watchListener = $scope.$watch(isMultiple, function (multiple) {
        if(multiple) {
          appendCheckbox();
        } else {
          removeCheckbox();
        }
      });
    };

    self.onDisableSelection = function () {
      watchListener = watchListener && watchListener();
    };
  };

  return {
    bindToController: true,
    controller: controller,
    controllerAs: '$mdHead',
    link: link,
    require: ['mdHead', '^^mdTable'],
    restrict: 'E'
  };
}]);