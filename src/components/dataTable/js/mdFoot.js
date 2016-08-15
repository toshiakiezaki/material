'use strict';

angular.module('material.components.table').directive('mdFoot', function() {

  function compile(tElement) {
    tElement.addClass('md-foot');
  }

  return {
    compile: compile,
    restrict: 'E'
  };
});

