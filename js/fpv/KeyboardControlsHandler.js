var onKeyDown = function (event) {
  if (event.keyCode == 38 || event.keyCode == 87) {
    moveForward = true
  } else
  if (event.keyCode == 37 || event.keyCode == 65) {
    moveLeft = true
  } else
  if (event.keyCode == 40 || event.keyCode == 83) {
    moveBackward = true
  } else
  if (event.keyCode == 39 || event.keyCode == 68) {
    moveRight = true
  } else
  if (event.keyCode == 32) {
    if (isJumping === true) {
      velocity.y += JUMP_HEIGHT
    }
    isJumping = false
  }

  if (event.keyCode == 16) {
    isRunning = true
  }

  if (event.keyCode == 82) {
    interact = true
  }
}

var onKeyUp = function (event) {
  if (event.keyCode == 38 || event.keyCode == 87) {
    moveForward = false
  } else
  if (event.keyCode == 37 || event.keyCode == 65) {
    moveLeft = false
  } else
  if (event.keyCode == 40 || event.keyCode == 83) {
    moveBackward = false
  } else
  if (event.keyCode == 39 || event.keyCode == 68) {
    moveRight = false
  } else
  if (event.keyCode == 16) {
    isRunning = false
  } else
  if (event.keyCode == 82) {
    interact = false
  }

}

document.addEventListener('keydown', onKeyDown, false)
document.addEventListener('keyup', onKeyUp, false)
