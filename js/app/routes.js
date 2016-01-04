(function () {
'use strict'

angular.module('appRoutes', [])
// .service('pointerlock', [
//   function () {
//     var element = document.body
//     this.change = function () {
//       return document.pointerLockElement === element
//           || document.mozPointerLockElement === element
//           || document.webkitPointerLockElement === element
//     }
//     this.available = function () {
//       // http://www.html5rocks.com/en/tutorials/pointerlock/intro/
//       return 'pointerLockElement' in document
//           || 'mozPointerLockElement' in document
//           || 'webkitPointerLockElement' in document
//     }
//     this.request = function () {
//       // Ask the browser to lock the pointer
//       return element.requestPointerLock
//           || element.mozRequestPointerLock
//           || element.webkitRequestPointerLock
//     }
//   }
// ])
// .config(['$routeProvider',
//   function ($routeProvider) {
//     $routeProvider
//     .when('/', {
//       templateUrl: 'pages/home.html',
//     })
//     .when('/:room*?', {
//       templateUrl: 'pages/components/start.html',
//       controller: function ($routeParams, $scope, $document, $controller) {
//           var appCtrls = angular.injector(['ng', 'appCtrls'])
//           var pointerlock = appCtrls.get('pointerlock')

//           var rooms = angular.injector(['ng', 'rooms'])
//           var configs = $routeParams.room + "Cfgs"
//           var config = rooms.get(configs)

//           var blocker = document.getElementById('blocker')
//           var instructions = document.getElementById('instructions')

//           if (pointerlock.available()) {
//             var start = function () {
//               blocker.style.display = 'none'
//               instructions.style.display = 'none'
//               $scope.start($document[0])
//             }
//             var error = function () {
//               instructions.style.display = ''
//             }
//             $scope.activateControls($document[0], start, error)
//             $scope.init(config)
//             $scope.animate()
//           } else {
//             instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API'
//           }
//         $controller($routeParams.room + "Ctrl", { $scope: $scope })
//       }
//     })
//     .otherwise({
//       redirectTo: '/'
//     })
//   }
// ])

}())
