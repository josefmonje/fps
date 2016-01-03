// environment
var FOG_MIN = 1000
var FOG_MAX = 1001
var FOG_COLOR = 0xffffff
var COLOR_SKY = 0xeeeeff
var COLOR_GROUND = 0x777788
var INTENSITY = 0.75
var BACKGROUND_COLOR = FOG_COLOR
// movement
var MOVESPEED = 150
var STRAFESPEED = MOVESPEED
var JUMP_HEIGHT = 200
// floor
var TILE_ZOOM = 8
var TILE_REPEAT = 80
var SCALE = 50
var GROUND_IMAGE = "./img/grass.png"
var TREE_OBJ = "./img/tree.obj"
// logic
var controlsEnabled = moveForward = moveBackward = moveLeft = moveRight = isJumping = isRunning = interact = false
var prevTime = performance.now()
var velocity = new THREE.Vector3()
// three.js
var camera, scene, renderer, geometry, material, mesh, raycaster, controls, objects = []

function init() {
  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10)

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(FOG_COLOR, FOG_MIN, FOG_MAX)
  var light = new THREE.HemisphereLight(COLOR_SKY, COLOR_GROUND, INTENSITY)
  light.position.set(0.5, 1, 0.75)
  scene.add(light)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000)
  controls = new THREE.PointerLockControls(camera)
  controls.noFly = true
  scene.add(controls.getObject())

  // renderer
  renderer = new THREE.WebGLRenderer()
  renderer.setClearColor(BACKGROUND_COLOR)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  window.addEventListener('resize', onWindowResize, false)

  // ground
  var textureLoader = new THREE.TextureLoader();
  textureLoader.load(GROUND_IMAGE, function (texture){
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(TILE_REPEAT, TILE_REPEAT)
    texture.anisotropy = 8

    var mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(TILE_ZOOM, TILE_ZOOM),
      new THREE.MeshPhongMaterial({ specular: 0x111111, map: texture })
    )
    mesh.rotation.x = -Math.PI/2
    mesh.receiveShadow = true
    mesh.scale.x = mesh.scale.y = mesh.scale.z = SCALE
    scene.add(mesh)
  })

  // tree
  var material = new THREE.MeshBasicMaterial({ color: 0x000000, shading: THREE.FlatShading })
  var objectLoader = new THREE.OBJLoader()
  objectLoader.load(TREE_OBJ, function (object) {
    object.material = material
    object.position.set(0, 0, -150)
    object.scale.multiplyScalar(250)
    scene.add(object)
    objects.push(object.children[0])
  })

  // box
  geometry = new THREE.BoxGeometry(20, 20, 20);
  for (var i = 0, l = geometry.faces.length; i < l; i ++) {
    var face = geometry.faces[i]
    face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
    face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
    face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
  }
  for (var i = 0; i < 1; i ++) {
    material = new THREE.MeshPhongMaterial({ specular: 0xffffff, shading: THREE.FlatShading, vertexColors: THREE.VertexColors })
    var mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = Math.floor(Math.random() * 20 - 10) * 20
    mesh.position.y = Math.floor(Math.random() * 20 ) * 1 + 4
    mesh.position.z = Math.floor(Math.random() * 20 - 10) * 20
    scene.add(mesh)
    material.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
    objects.push(mesh)
  }

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function animate() {
  var intersections, hasCollisions
  var time = performance.now()
  var delta = (time - prevTime) / 1000
  var myPosition = controls.getObject().position

  var setupView = function () {
    raycaster.ray.origin.copy(myPosition)
    raycaster.ray.origin.y -= 10
    intersections = raycaster.intersectObjects(objects)
    hasCollisions = intersections.length != 0
  }

  var getMovement = function () {
    velocity.x -= velocity.x * 10.0 * delta
    velocity.z -= velocity.z * 10.0 * delta
    velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

    if (interact) {
    }

    if (hasCollisions) {
      velocity.y = Math.max(0, velocity.y)
      if (intersections[0].point.y - myPosition.y < 20) {
        myPosition.setY(intersections[0].point.y + 20)
      }
      isJumping = true
    } else
    if (!hasCollisions) {
    }

    if (isRunning) {
      speed = MOVESPEED * 5
    } else {
      speed = MOVESPEED
    }

    if (moveForward && hasCollisions) {
      // for anti-collision/stuck logics
    } else if (moveForward) {
      velocity.z -= speed * delta
    } else

    if (moveBackward && hasCollisions) {
    } else if (moveBackward) {
      velocity.z += speed * delta
    }

    if (moveRight && hasCollisions) {
    } else if (moveRight) {
      velocity.x += STRAFESPEED * delta
    } else

    if (moveLeft && hasCollisions) {
    } else if (moveLeft) {
      velocity.x -= STRAFESPEED * delta
    }
  }

  var setMovement = function () {
    controls.getObject().translateX(velocity.x * delta)
    controls.getObject().translateY(velocity.y * delta)
    controls.getObject().translateZ(velocity.z * delta)
  }

  var setPositionOnPlane = function () {
    if (myPosition.y < 10) {
      velocity.y = 0
      myPosition.y = 10
      isJumping = true
    }
  }

  requestAnimationFrame(animate)
  if (controlsEnabled) {
    setupView()
    getMovement()
    setMovement()
    setPositionOnPlane()
    prevTime = time
  }
  renderer.render(scene, camera)
}

init()
animate()
