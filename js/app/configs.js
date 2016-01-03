(function () {
'use strict'

angular.module('appCfgs', [])
.constant('appCfg', {
  apiUrl: 'http://localhost:8000',
  clientId: 'bZFKB5edI2HDQgmCDniR724II4aOlOuqTGDm2OZT',
  clientSecret: 'bf6rO1Ycs1G2akM9aWHLFgT2ys24PwTRgyaN0OcGKSqpCxhNcGkD1KQekSmTXxwLYTlS6M7XtKX12hf5dDnrGz1IRmceLKLRHFujMu9VKKW78sEIWYGCuYUpOhtXjvpz',
})
.config(['$compileProvider', '$httpProvider', '$resourceProvider', '$locationProvider',
  function ($compileProvider, $httpProvider, $resourceProvider, $locationProvider) {

    $compileProvider.debugInfoEnabled(false) // Production setting
    $httpProvider.defaults.useXDomain = true // Enable cross domain calls
    delete $httpProvider.defaults.headers.common['X-Requested-With'] // Remove ajax call header (prevents CORS)

    $resourceProvider.defaults.stripTrailingSlashes = false

    $locationProvider.html5Mode({
      // enabled: true,
      enabled: false,
      requireBase: false
    })

  }
])
.run(['$http', '$rootScope',
  function ($http, $rootScope) {
    delete $http.defaults.headers.common['X-Requested-With']
  }
])
}())
