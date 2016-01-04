(function () {
'use strict'

angular.module('app', [
  'appCfgs',
  'appCtrls',
  'rooms',
])

angular.module('appCtrls', [])
.constant('moveCfgs', {
  MOVESPEED: 250,
  STRAFESPEED: 250,
  JUMP_HEIGHT: 250,
  RUNMULTIPLIER: 3,
  BULLETSPEED: 10,
})
.service('pointerlock', [
  function () {
    var element = document.body
    this.change = function () {
      return document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element
    }
    this.available = function () { // http://www.html5rocks.com/en/tutorials/pointerlock/intro/
      return 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document
    }
    this.request = function () { // Ask the browser to lock the pointer
      return element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock
    }
  }
])
.service('fullscreen', [
  function () {
    var element = document.body
    this.element = function () {
      return document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element
    }
    this.request = function () {
      return element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen
    }
  }
])
.controller('PersistentCtrl', ['$scope', '$document', 'moveCfgs', 'treeCfgs', 'pointerlock',
  function ($scope, $document, moveCfgs, treeCfgs, pointerlock) {
    var moveForward = false
    var moveBackward = false
    var moveLeft = false
    var moveRight = false
    var canJump = false
    var isRunning = false
    var interact = false
    var reset = false
    var projector = new THREE.Projector()
    $scope.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
    $scope.controls = new THREE.PointerLockControls($scope.camera)
    $scope.myPosition = $scope.controls.getObject().position
    $scope.controlsEnabled = false
    $scope.mouse = {x: 0, y: 0}
    $scope.bullets = []

    var onWindowResize = function () {
      $scope.camera.aspect = window.innerWidth / window.innerHeight
      $scope.camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onWindowResize, false)

    var onKeyDown = function (event) {
      if (event.keyCode == 16) { isRunning = true } else
      if (event.keyCode == 82) { interact = true } else
      if (event.keyCode == 81) { reset = true } else
      if (event.keyCode == 38 || event.keyCode == 87) { moveForward = true } else
      if (event.keyCode == 37 || event.keyCode == 65) { moveLeft = true } else
      if (event.keyCode == 40 || event.keyCode == 83) { moveBackward = true } else
      if (event.keyCode == 39 || event.keyCode == 68) { moveRight = true } else
      if (event.keyCode == 32) {
        if (canJump === true) { $scope.velocity.y += moveCfgs.JUMP_HEIGHT }
        canJump = false
      }
    }

    var onKeyUp = function (event) {
      if (event.keyCode == 38 || event.keyCode == 87) { moveForward = false } else
      if (event.keyCode == 37 || event.keyCode == 65) { moveLeft = false } else
      if (event.keyCode == 40 || event.keyCode == 83) { moveBackward = false } else
      if (event.keyCode == 39 || event.keyCode == 68) { moveRight = false } else
      if (event.keyCode == 16) { isRunning = false } else
      if (event.keyCode == 82) { interact = false } else
      if (event.keyCode == 81) { reset = false }
    }

    var onMouseMove = function (event) {
      event.preventDefault();
      $scope.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      $scope.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    var startControls = function (document) {
      document.body.requestPointerLock = pointerlock.request()
      if (/Firefox/i.test(navigator.userAgent)) {
        var fullscreenchange = function () {
          if (fullscreen.element()) {
            document.onfullscreenchange = null
            document.onmozfullscreenchange = null
            document.requestPointerLock()
          }
        }
        document.onfullscreenchange = fullscreenchange
        document.onmozfullscreenchange = fullscreenchange
        document.body.requestFullscreen = fullscreen.request()
        document.body.requestFullscreen()
      } else {
        document.body.requestPointerLock()
      }
    }

    $scope.start = function (document) {
      document.onclick = $scope.createBullet
      document.onkeydown = onKeyDown
      document.onkeyup = onKeyUp
      document.onmousemove = onMouseMove
      startControls(document)
    }

    var lockChange = function () {
      if (pointerlock.change()) {
        $scope.controlsEnabled = true
        $scope.controls.enabled = true
      } else {
        $scope.controls.enabled = false
      }
    }

    $scope.activateControls = function (document, start, error) {
      document.onclick = start
      document.onpointerlockchange = lockChange
      document.onmozpointerlockchange = lockChange
      document.onwebkitpointerlockchange = lockChange
      document.onpointererror = error
      document.onmozpointererror = error
      document.onwebkitpointererror = error
    }

    $scope.init = function (config) {
      $scope.scene = new THREE.Scene()
      $scope.objects = []
      $scope.prevTime = performance.now()
      $scope.velocity = new THREE.Vector3()
      var createScene = function () {
        $scope.scene.fog = new THREE.Fog(config.FOG_COLOR, config.FOG_MIN, config.FOG_MAX)
        var light = new THREE.HemisphereLight(config.COLOR_SKY, config.COLOR_GROUND, config.LIGHT_INTENSITY)
        light.position.set(0.5, 1, 0.75)
        $scope.scene.add(light)
        $scope.renderer.setClearColor(config.BACKGROUND_COLOR)
        $scope.scene.add($scope.controls.getObject())
      }

      var createGround = function () {
        var textureLoader = new THREE.TextureLoader();
        textureLoader.load(config.GROUND_IMAGE, function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping
          texture.repeat.set(config.TILE_REPEAT, config.TILE_REPEAT)

          var mesh = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(config.TILE_ZOOM, config.TILE_ZOOM),
            new THREE.MeshPhongMaterial({ specular: 0x111111, map: texture })
          )
          mesh.rotation.x = -Math.PI/2
          mesh.receiveShadow = config.RCVSHADOW
          mesh.scale.x = config.GROUND_SCALE.x
          mesh.scale.y = config.GROUND_SCALE.y
          mesh.scale.z = config.GROUND_SCALE.z
          $scope.scene.add(mesh)
        })
      }
      createScene()
      createGround()
    }

    var getView = function () {
      var raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10)
      raycaster.ray.origin.copy($scope.myPosition)
      raycaster.ray.origin.y -= 10
      return raycaster.intersectObjects($scope.objects)
    }

    var getMovement = function (delta, intersections) {
      var hasCollisions = intersections.length != 0
      var speed = 0

      if (reset) {
        $scope.myPosition.x = 0
        $scope.myPosition.y = 0
        $scope.myPosition.z = 0
      }

      $scope.velocity.x -= $scope.velocity.x * 10.0 * delta
      $scope.velocity.z -= $scope.velocity.z * 10.0 * delta
      $scope.velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

      if (interact) { }

      if (hasCollisions) {
        $scope.velocity.y = Math.max(0, $scope.velocity.y)
        if (intersections[0].point.x == $scope.myPosition.x || intersections[0].point.z == $scope.myPosition.z) {
          $scope.myPosition.x = $scope.prevPosition.x
          $scope.myPosition.y = $scope.prevPosition.y
          $scope.myPosition.z = $scope.prevPosition.z
        }
        if (intersections[0].point.y - $scope.myPosition.y <= 19) {
          $scope.myPosition.setY(intersections[0].point.y + 20)
        }
        canJump = true
      } else
      if (!hasCollisions) { $scope.prevPosition = $scope.myPosition }

      if (isRunning) { speed = moveCfgs.MOVESPEED * moveCfgs.RUNMULTIPLIER }
        else { speed = moveCfgs.MOVESPEED }
      if (moveForward) { $scope.velocity.z -= speed * delta }
      if (moveBackward) { $scope.velocity.z += speed * delta }
      if (moveRight) { $scope.velocity.x += moveCfgs.STRAFESPEED * delta }
      if (moveLeft) { $scope.velocity.x -= moveCfgs.STRAFESPEED * delta }

    }

    var setMovement = function (delta) {
      $scope.controls.getObject().translateX($scope.velocity.x * delta)
      $scope.controls.getObject().translateY($scope.velocity.y * delta)
      $scope.controls.getObject().translateZ($scope.velocity.z * delta)
    }

    var setPositionOnGround = function () {
      if ($scope.myPosition.y < 10) {
        $scope.velocity.y = 0
        $scope.myPosition.y = 10
        canJump = true
      }
    }

    $scope.animate = function () {
      $scope.time = performance.now()
      var delta = ($scope.time - $scope.prevTime) / 1000

      requestAnimationFrame($scope.animate)
      if ($scope.controlsEnabled) {
        var intersections = getView()
        getMovement(delta, intersections)
        setMovement(delta)
        $scope.updateBullets(delta)
        setPositionOnGround()
        $scope.prevTime = $scope.time
      }
      $scope.renderer.render($scope.scene, $scope.camera)
    }

    var renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)
    $scope.renderer = renderer

    // objects
    $scope.createBox = function (config, number, x, z) {
      var material = new THREE.MeshPhongMaterial({ specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors })
      material.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
      var geometry = new THREE.BoxGeometry(20, 20, 20);
      for (var i = 0, l = geometry.faces.length; i < l; i ++) {
        geometry.faces[i].vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
        geometry.faces[i].vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
        geometry.faces[i].vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
      }
      for (var i = 0; i < 1; i ++) {
        var mesh = new THREE.Mesh(geometry, material)
        mesh.position.y = Math.floor(Math.random() * 20)
        mesh.position.x = x || Math.floor(
          Math.random() * config.GROUND_SCALE.x * config.TILE_ZOOM)-((config.GROUND_SCALE.x * config.TILE_ZOOM)/2)
        mesh.position.z = z || Math.floor(
          Math.random() * config.GROUND_SCALE.z * config.TILE_ZOOM)-((config.GROUND_SCALE.z * config.TILE_ZOOM)/2)
        $scope.scene.add(mesh)
        $scope.objects.push(mesh)
      }
    }

    $scope.createTree = function (config, number, x, z) {
      var material = new THREE.MeshBasicMaterial({ color: 0x000000, shading: THREE.FlatShading })
      var objectLoader = new THREE.OBJLoader()
      for (var i = number-1; i >= 0; i--) {
        objectLoader.load(config.TREE_OBJ, function (object) {
          object.material = material
          object.scale.y = Math.floor((Math.random()+.1) * config.OBJECTS_SCALE.y)
          object.scale.multiplyScalar(config.OBJECTS_SCALE.multiple)
          object.rotation.y = Math.floor(Math.random() * 360)
          object.position.x = x || Math.floor(
            Math.random() * config.GROUND_SCALE.x * config.TILE_ZOOM)-((config.GROUND_SCALE.x * config.TILE_ZOOM) / 2)
          object.position.z = z || Math.floor(
            Math.random() * config.GROUND_SCALE.z * config.TILE_ZOOM)-((config.GROUND_SCALE.z * config.TILE_ZOOM) / 2)
          $scope.scene.add(object)
          $scope.objects.push(object.children[0])
        })
      }
    }

    $scope.createBullet = function () {
      var material = new THREE.MeshBasicMaterial({color: 0x333333})
      var geometry = new THREE.SphereGeometry(2, 6, 6)
      var vector = new THREE.Vector3($scope.mouse.x, $scope.mouse.y, 1)
      vector.unproject($scope.camera)
      var bullet = new THREE.Mesh(geometry, material)
      bullet.position.set($scope.myPosition.x, $scope.myPosition.y, $scope.myPosition.z)
      bullet.ray = new THREE.Ray($scope.camera.position, vector.sub($scope.camera.position).normalize())
      bullet.owner = $scope.camera
      bullet.castShadow = true
      $scope.bullets.push(bullet)
      $scope.scene.add(bullet)
      startControls($document[0]) // added this so all clicks regain pointer lock
    }

    $scope.updateBullets = function (delta) {
      for (var i = $scope.bullets.length-1; i >= 0; i--) {
        var bullet = $scope.bullets[i]
        var direction = bullet.ray.direction
        bullet.translateX(moveCfgs.BULLETSPEED * direction.x)
        bullet.translateY(moveCfgs.BULLETSPEED * direction.y)
        bullet.translateZ(moveCfgs.BULLETSPEED * direction.z)
        if (bullet.position.y < 1 || bullet.position.y > 1000) {
          $scope.bullets.splice(i, 1)
          $scope.scene.remove(bullet)
        }
      }
    }

  }
])

angular.module('rooms', ['ngRoute'])
.constant('treeCfgs', {
  FOG_COLOR: 0xffffff,
  FOG_MIN: 50,
  FOG_MAX: 300,
  COLOR_SKY: 0xeeeeff,
  COLOR_GROUND: 0x777788,
  LIGHT_INTENSITY: 0.75,
  BACKGROUND_COLOR: 0xffffff,
  GROUND_IMAGE: "./img/terrain/grass.png",
  RCVSHADOW: true,
  TILE_REPEAT: 80,
  TILE_ZOOM: 8,
  GROUND_SCALE: {x: 50, y: 50, z: 50},
  OBJECTS_SCALE: {x: 0, y: 10, z: 0, multiple: 50},
  SCALE_X: 50,
  SCALE_Y: 50,
  SCALE_Z: 50,
  TREE_OBJ: "./img/objects/tree/tree.obj",
})
.constant('forestCfgs', {
  FOG_COLOR: 0xffffff,
  FOG_MIN: 30,
  FOG_MAX: 200,
  COLOR_SKY: 0xeeeeff,
  COLOR_GROUND: 0x777788,
  LIGHT_INTENSITY: 0.75,
  BACKGROUND_COLOR: 0xffffff,
  GROUND_IMAGE: "./img/terrain/grass.png",
  RCVSHADOW: true,
  TILE_REPEAT: 80,
  TILE_ZOOM: 8,
  GROUND_SCALE: {x: 50, y: 50, z: 50},
  OBJECTS_SCALE: {x: 0, y: 10, z: 0, multiple: 50},
  TREE_OBJ: "./img/objects/tree/tree.obj",
})
.constant('deepforestCfgs', {
  FOG_COLOR: 0x777788,
  FOG_MIN: 15,
  FOG_MAX: 200,
  COLOR_SKY: 0xeeeeff,
  COLOR_GROUND: 0x777788,
  LIGHT_INTENSITY: 0.5,
  BACKGROUND_COLOR: 0xffffff,
  GROUND_IMAGE: "./img/terrain/dirt.png",
  RCVSHADOW: true,
  TILE_REPEAT: 80,
  TILE_ZOOM: 8,
  GROUND_SCALE: {x: 50, y: 50, z: 50},
  OBJECTS_SCALE: {x: 10, y: 10, z: 10, multiple: 100},
  TREE_OBJ: "./img/objects/tree/tree.obj",
})
.controller('treeCtrl', ['$scope', 'treeCfgs',
  function ($scope, treeCfgs) {
    $scope.createTree(treeCfgs, 1, 1, -100)
    $scope.createBox(treeCfgs)
  }
])
.controller('forestCtrl', ['$scope', 'forestCfgs',
  function ($scope, forestCfgs) {
    $scope.createTree(forestCfgs, 20)
  }
])
.controller('deepforestCtrl', ['$scope', 'deepforestCfgs',
  function ($scope, deepforestCfgs) {
    $scope.createTree(deepforestCfgs, 40)
  }
])
.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
    .otherwise({ redirectTo: '/' })
    .when('/', { templateUrl: 'pages/home.html' })
    .when('/:room*?', {
      templateUrl: 'pages/components/start.html',
      controller: ['$routeParams', '$scope', 'pointerlock', '$document', '$controller',
        function ($routeParams, $scope, pointerlock, $document, $controller) {
          var blocker = document.getElementById('blocker')
          var instructions = document.getElementById('instructions')

          var config = $routeParams.room + "Cfgs"
          var config = angular.injector(['ng', 'rooms']).get(config)
          var controller = $routeParams.room + "Ctrl"

          if (pointerlock.available()) {
            var start = function () {
              blocker.style.display = 'none'
              instructions.style.display = 'none'
              $scope.start($document[0])
            }
            var error = function () {
              instructions.style.display = ''
            }
            $scope.activateControls($document[0], start, error)
          } else {
            instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API'
          }

          $scope.init(config)
          $scope.animate()
          $controller(controller, { $scope: $scope })
        }
      ]
    })

  }
])

}())
