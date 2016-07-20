angular.module('material.components.table').directive('mdCell', ['$compile', '$mdUtil', function($compile, $mdUtil) {

  function controller() {
  }

  function link($scope, $element, $attrs, $ctrls) {
    var self       = $ctrls[0],
        table      = $ctrls[1],
        search     = table.search,
        jqLite     = angular.element,
        alignments = ['left', 'right', 'center', 'justify'];

    Object.defineProperty(self, 'index', {
      get: function () {
        var nodeList = Array.prototype.slice.call($element.parent().children());
        return nodeList.indexOf($element[0]);
      }
    });

    self.getAlignment = function () {
      return search(table.tHead.children, function (row) {
        return jqLite(row.children[self.index]).data('align');
      });
    };

    $scope.$watch(self.getAlignment, function (value) {
      alignments.forEach(function (alignment) {
        if(value === alignment) {
          $element.addClass('md-align-' + alignment);
        } else {
          $element.removeClass('md-align-' + alignment);
        }
      });
    });
  }

  return {
    controller: controller,
    controllerAs: '$mdCell',
    link: link,
    require: ['mdCell', '^^mdTable'],
    restrict: 'E',
  };
}]);