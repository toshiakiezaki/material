angular.module('material.components.table').directive('mdOrderBy', ['$compile', '$mdUtil', function($compile, $mdUtil) {

  var SORT_ICON = '<md-icon class="md-sort-icon" ng-class="$mdOrderBy.getDirection()" md-svg-icon="md-arrow-up"></md-icon>';

  function controller() {
  }

  function link($scope, $element, $attrs, $ctrls) {
    var self          = $ctrls[0],
        cell          = $ctrls[1],
        order         = $ctrls[2],
        table         = $ctrls[3],
        find          = table.find,
        watchListener;

    self.orderRegex = new RegExp('^-?' + $attrs.mdOrderBy + '$');

    function isActive() {
      return self.orderRegex.test(order.value);
    };

    function setOrder() {
      $scope.$applyAsync(function () {
        if(isActive()) {
          order.setOrder(order.value.charAt(0) === '-' ? $attrs.mdOrderBy : '-' + $attrs.mdOrderBy);
        } else {
          order.setOrder($mdUtil.parseAttributeBoolean($attrs.mdDesc) ? '-' + $attrs.mdOrderBy : $attrs.mdOrderBy);
        }
      });
    };

    function getSortIcon() {
      return find($element.find('md-icon'), function (icon) {
        return icon.classList.contains('md-sort-icon');
      });
    };

    function enableSorting() {
      $element.addClass('md-sort').on('click', setOrder);

      if(!$element.children().length) {
        $element.contents().wrap('<span>');
      }

      if(self.numeric) {
        $element.prepend($compile(SORT_ICON)($scope));
      } else {
        $element.append($compile(SORT_ICON)($scope));
      }

      watchListener = $scope.$watch(isActive, function (active) {
        if(active) {
          $element.addClass('md-active');
        } else {
          $element.removeClass('md-active');
        }
      });
    };

    //FIXME not used?
    function disableSorting() {
      var icon = getSortIcon();

      if(icon) {
        $element[0].removeChild(icon);
      }

      if(angular.isFunction(watchListener)) {
        watchListener();
      }

      $element.removeClass('md-sort').off('click', setOrder);
    };

    self.getDirection = function () {
      if(isActive()) {
        return order.value.charAt(0) === '-' ? 'md-desc' : 'md-asc';
      }

      return $mdUtil.parseAttributeBoolean($attrs.mdDesc) ? 'md-desc' : 'md-asc';
    };

    $attrs.$observe('mdOrderBy', function (orderBy) {
      if(orderBy) {
        enableSorting();
      } else {
        disableSorting();
      }
    });

    $scope.$watch(cell.getIndex, function () {
      if($attrs.mdOrderBy) {
        var icon = getSortIcon();

        if(icon) {
          if($element.hasClass('md-align-right')) {
            $element.prepend(icon);
          } else {
            $element.append(icon);
          }
        }
      }
    });
  };

  return {
    controller: controller,
    controllerAs: '$mdOrderBy',
    link: link,
    require: ['mdOrderBy', 'mdCell', '^^mdOrder', '^^mdTable'],
    restrict: 'A',
    scope: {}
  };
}]);