angular.module('material.components.table').directive('mdRow', function() {

  function controller() {
  };

  function link($scope, $element, $attrs, $ctrls) {
    var self   = $ctrls[0],
        select = $ctrls[1],
        head   = $ctrls[2],
        table  = $ctrls[3],
        item   = table.item;

    function onEnableSelection() {
      $element.prepend(angular.element('<md-cell>').addClass('md-checkbox-cell'));

      if(head) {
        head.onEnableSelection();
      } else if(select) {
        select.enable();
      }
    };

    function onDisableSelection() {
      if(head) {
        head.onDisableSelection();
      } else if(select) {
        select.disable();
      }

      var cell = table.find(self.cells(), function (cell) {
        return cell.classList.contains('md-checkbox-cell');
      });

      return cell && cell.parentNode.removeChild(cell);
    };

    self.cells = function (index) {
      return isNaN(index) ? $element[0].children : item($element[0].children, index);
    };

    $scope.$watch(table.enableSelection, function (enable) {
      if(enable) {
        onEnableSelection();
      } else {
        onDisableSelection();
      }
    });
  };

  return {
    controller: controller,
    link: link,
    require: ['mdRow', '?mdSelect', '?^^mdHead', '^^mdTable'],
    restrict: 'E'
  };
});