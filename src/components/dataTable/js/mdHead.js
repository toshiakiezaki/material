'use strict';

angular.module('material.components.table').directive('mdHead', ['$compile', function($compile) {

  function compile(tElement) {
    tElement.addClass('md-head');
    return postLink;
  }

  // empty controller to be bind scope properties to
  function Controller() {

  }

  function postLink(scope, element, attrs, tableCtrl) {
    // because scope.$watch is unpredictable
    var oldValue = new Array(2);

    function addCheckboxColumn() {
      if (!element.hasClass('md-table-progress')) {
        element.children().prepend('<md-column class="md-column md-checkbox-column">');
      }
    }

    function attatchCheckbox() {
      if (!element.hasClass('md-table-progress')) {
        element.prop('lastElementChild').firstElementChild.appendChild($compile(createCheckBox())(scope)[0]);
      }
    }

    function createCheckBox() {
      return angular.element('<md-checkbox>').attr({
        'aria-label': 'Select All',
        'ng-click': 'toggleAll()',
        'ng-checked': 'allSelected()',
        'md-indeterminate': 'indeterminateSelect()',
        'ng-disabled': '!getSelectableRows().length'
      });
    }

    function detachCheckbox() {
      var cell = element.prop('lastElementChild').firstElementChild;

      if(cell.classList.contains('md-checkbox-column')) {
        angular.element(cell).empty();
      }
    }

    function enableRowSelection() {
      return tableCtrl.$$rowSelect;
    }

    function mdSelectCtrl(row) {
      return angular.element(row).controller('mdSelect');
    }

    function removeCheckboxColumn() {
      Array.prototype.some.call(element.find('md-column'), function (cell) {
        return cell.classList.contains('md-checkbox-column') && cell.remove();
      });
    }

    scope.allSelected = function () {
      var rows = scope.getSelectableRows();

      return rows.length && rows.every(function (row) {
        return row.isSelected();
      });
    };

    scope.indeterminateSelect = function () {
      return tableCtrl.getSelectedRows().length > 0 && (tableCtrl.getTableData().length != tableCtrl.getSelectedRows().length);
    };

    scope.getSelectableRows = function () {
      return tableCtrl.getBodyRows().map(mdSelectCtrl).filter(function (ctrl) {
        return ctrl && !ctrl.disabled;
      });
    };

    scope.selectAll = function () {
      tableCtrl.getBodyRows().map(mdSelectCtrl).forEach(function (ctrl) {
        if(ctrl && !ctrl.isSelected()) {
          ctrl.select();
        }
      });
    };

    scope.toggleAll = function () {
      return scope.allSelected() ? scope.unSelectAll() : scope.selectAll();
    };

    scope.unSelectAll = function () {
      tableCtrl.getBodyRows().map(mdSelectCtrl).forEach(function (ctrl) {
        if(ctrl && ctrl.isSelected()) {
          ctrl.deselect();
        }
      });
    };

    scope.$watchGroup([enableRowSelection, tableCtrl.enableMultiSelect], function (newValue) {
      if(newValue[0] !== oldValue[0]) {
        if(newValue[0]) {
          addCheckboxColumn();

          if(newValue[1]) {
            attatchCheckbox();
          }
        } else {
          removeCheckboxColumn();
        }
      } else if(newValue[0] && newValue[1] !== oldValue[1]) {
        if(newValue[1]) {
          attatchCheckbox();
        } else {
          detachCheckbox();
        }
      }

      angular.copy(newValue, oldValue);
    });
  }

  return {
    bindToController: true,
    compile: compile,
    controller: Controller,
    controllerAs: '$mdHead',
    require: '^^mdTable',
    restrict: 'E',
    scope: {
      order: '=?mdOrder',
      onReorder: '=?mdOnReorder'
    }
  };
}]);