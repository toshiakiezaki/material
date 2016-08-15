'use strict';

angular.module('material.components.table').directive('mdBody', function() {

  function compile(tElement) {
    tElement.addClass('md-body');
  }

  return {
    compile: compile,
    restrict: 'E'
  };
});

