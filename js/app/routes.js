(function () {
'use strict'

angular.module('appRoutes', [])
.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
    .when('/', {
      templateUrl: 'pages/home.html',
    })
    .when('/:room*?', {
      templateUrl: 'pages/components/start.html',
      controller: function ($routeParams, $scope, $controller) {
        $controller($routeParams.room + "Ctrl", { $scope: $scope })
      }
    })
    .otherwise({
      redirectTo: '/'
    })
  }
])
}())
