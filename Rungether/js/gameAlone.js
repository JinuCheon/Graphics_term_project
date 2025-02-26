

/**
 * Constants used in this game.
 */
var Colors = {
   cherry: 0xe35d6a,
   blue: 0x1560bd,
   white: 0xd8d0d1,
   black: 0x000000,
   brown: 0x654321,
   peach: 0xffdab9,
   yellow: 0xffff00,
   olive: 0x556b2f,
   grey: 0x696969,
   sand: 0x835c3b,
   brownDark: 0x23190f,
   green: 0x669900,
   grass: 0xE5D85C
};

var deg2Rad = Math.PI / 180;

var cameraX = 0;
var cameraY = 1500;
var cameraZ = -1000;

var runningCharacter;
var runningaction;
// Make a new world when the page is loaded.
window.addEventListener('load', function(){
	new World();
});



/** 
  * A class of which the world is an instance. Initializes the game
  * and contains the main game loop.
  *
  */
function World() {

	// Explicit binding of this even in changing contexts.
	var self = this;
	// Scoped variables in this world.
	var element, scene, camera, character, renderer, light,
		objects, paused, keysAllowed, score, difficulty,
		treePresenceProb, maxTreeSize, fogDistance, gameOver;
	var clock = new THREE.Clock();
	var mixer = new THREE.AnimationMixer(scene);
	// Initialize the world.
	init();
	/**
	  * Builds the renderer, scene, lights, camera, and the character,
	  * then begins the rendering loop.
	  */
	function init() {

		// Locate where the world is to be located on the screen.
		element = document.getElementById('world');

		// Initialize the renderer.
		renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});
		renderer.setSize(element.clientWidth, element.clientHeight);
		renderer.shadowMap.enabled = true;
		element.appendChild(renderer.domElement);

		// Initialize the scene.
		scene = new THREE.Scene();
		fogDistance = 40000;
		scene.fog = new THREE.Fog(0xbadbe4, 1, fogDistance);

		// Initialize the camera with field of view, aspect ratio,
		// near plane, and far plane.
		camera = new THREE.PerspectiveCamera(
			60, element.clientWidth / element.clientHeight, 1, 120000);

		//camera.position.set(0, 1500, -2000);
		camera.position.set(cameraX, cameraY, cameraZ);
		camera.lookAt(new THREE.Vector3(0, 600, -5000));
		window.camera = camera;
		

		// Set up resizing capabilities.
		window.addEventListener('resize', handleWindowResize, false);

		// Initialize the lights.
		light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
		scene.add(light);

		// Initialize the character and add it to the scene.
		character = new rCharacter();

		 ground = new Ground();
		 scene.add(ground.element);
		
		
		const loader = new THREE.GLTFLoader();
		loader.load('./model/scene.gltf', function(gltf){
		  running = gltf.scene.children[0];
		  running.scale.set(0.3,0.3,0.3);
		  running.position.set(5,5,-3200);
		  scene.add(gltf.scene);
		  runningCharacter = running;
		  console.log(typeof(runningCharacter));
		  mixer = new THREE.AnimationMixer( gltf.scene );
		  var action = mixer.clipAction( gltf.animations[ 0 ] );
		  runningaction = action;
		  }, undefined, function (error) {
			console.error(error);
		});
		

		var tree;
		objects = [];
		treePresenceProb = 0.2;
		maxTreeSize = 0.7;
		for (var i = 10; i < 40; i++) {
			createRowOfTrees(i * -3000, treePresenceProb, 0.6, maxTreeSize);
		}

		// The game is paused to begin with and the game is not over.
		gameOver = false;
		paused = true;

		// Start receiving feedback from the player.
		var left = 37;
		var up = 38;
		var right = 39;
		var p = 80;

		var w = 87;
		var a = 65;
		var s = 83;
		var d = 68;

		var q = 81;
		var ee = 69;
		
		keysAllowed = {};
		document.addEventListener(
			'keydown',
			function(e) {
				if (!gameOver) {
					var key = e.keyCode;
					if (keysAllowed[key] === false) return;
					keysAllowed[key] = false;
					if (paused && !collisionsDetected() && key == 13) {
						paused = false;
						character.onUnpause();
						document.getElementById(
							"variable-content").style.visibility = "hidden";
						document.getElementById(
							"controls").style.display = "none";
					} else {
						if (key == p) {
							paused = true;
							character.onPause();
							document.getElementById(
								"variable-content").style.visibility = "visible";
							document.getElementById(
								"variable-content").innerHTML = 
								"Game is paused. Press enter to resume.";
						}
						if (key == up && !paused) {
							character.onUpKeyPressed();
						}
						if (key == left && !paused) {
							character.onLeftKeyPressed();
						}
						if (key == right && !paused) {
							character.onRightKeyPressed();
						}
						//camera position setting
						if (key == w && paused) {
							character.onWKeyPressed();
						}
						if (key == s && paused) {
							character.onSKeyPressed();
						}
						if (key == a && paused) {
							character.onAKeyPressed();
						}
						if (key == d && paused) {
							character.onDKeyPressed();
						}
						if (key == q && paused) {
							character.onQKeyPressed();
						}
						if (key == ee && paused) {
							character.onEKeyPressed();
						}
						if (key == 49 && paused) {
							character.on1KeyPressed();
						}
						if (key == 50 && paused) {
							character.on2KeyPressed();
						}
						if (key == 51 && paused) {
							character.on3KeyPressed();
						}
						if (key == 52 && paused) {
							character.on4KeyPressed();
						}
						if (key == 53 && paused) {
							character.on5KeyPressed();
						}
					}
				}
			}
		);

		document.addEventListener(
			'keyup',
			function(e) {
				keysAllowed[e.keyCode] = true;
			}
		);
		document.addEventListener(
			'focus',
			function(e) {
				keysAllowed = {};
			}
		);

		// Initialize the scores and difficulty.
		score = 0;
		difficulty = 0;
		document.getElementById("score").innerHTML = score;

		
      motionValue = -60;
      out = false;

		// Begin the rendering loop.
		loop();

	}
	
	/**
	  * The main animation loop.
	  */
	function loop() {
		// Update the game.
		if (!paused) {

			// Add more trees and increase the difficulty.
			if ((objects[objects.length - 1].mesh.position.z) % 3000 == 0) {
				difficulty += 1;
				var levelLength = 30;
				if (difficulty % levelLength == 0) {
					var level = difficulty / levelLength;
					switch (level) {
						case 1:
							treePresenceProb = 0.35;
							maxTreeSize = 0.7;
							break;
						case 2:
							treePresenceProb = 0.35;
							maxTreeSize = 0.85;
							break;
						case 3:
							treePresenceProb = 0.5;
							maxTreeSize = 0.85;
							break;
						case 4:
							treePresenceProb = 0.5;
							maxTreeSize = 1.1;
							break;
						case 5:
							treePresenceProb = 0.5;
							maxTreeSize = 1.1;
							break;
						case 6:
							treePresenceProb = 0.55;
							maxTreeSize = 1.1;
							break;
						default:
							treePresenceProb = 0.55;
							maxTreeSize = 1.25;
					}
				}
				if ((difficulty >= 5 * levelLength && difficulty < 6 * levelLength)) {
					fogDistance -= (25000 / levelLength);
				} else if (difficulty >= 8 * levelLength && difficulty < 9 * levelLength) {
					fogDistance -= (5000 / levelLength);
				}
				createRowOfTrees(-120000, treePresenceProb, 0.7, maxTreeSize);
				scene.fog.far = fogDistance;
			}

			// Move the trees closer to the character.
			objects.forEach(function(object) {
				object.mesh.position.z += 100;
			});

			// Remove trees that are outside of the world.
			objects = objects.filter(function(object) {
				return object.mesh.position.z < 0;
			});

			if(motionValue>=-60 && motionValue<0){
            if(character.currentLane <= -2 || character.currentLane>=2)
               out = true;
         }

         // Give motion to the ground
         if(motionValue>=0 && motionValue<10){
            ground.onLeft();
            objects.forEach(function(object) {
               object.mesh.position.x -= 10;
            });

            if(motionValue>=8 && motionValue<10){
               if(character.currentLane>=1) {
                  out = true;
               }
            }
         }

         if(motionValue>=10 && motionValue<30){
            ground.onRight();
            objects.forEach(function(object) {
               object.mesh.position.x += 10;
            });

            if(motionValue>=10 && motionValue<13){
               if(character.currentLane>=1) {
                  out = true;
               }
            }
            if(motionValue>=19 && motionValue<28){
               if(character.currentLane<=-2) {
                  out = true;
               }
            }
            if(motionValue>=28 && motionValue<30){
               if(character.currentLane<=-1) {
                  out = true;
               }
            }

         }

         if(motionValue>=30 && motionValue<40){
            ground.onLeft();
            objects.forEach(function(object) {
               object.mesh.position.x -= 10;
            });

            if(motionValue>=30 && motionValue<38){
               if(character.currentLane<=-1) {
                  out = true;
               }
            }
            if(motionValue>=39 && motionValue<40){
               if(character.currentLane>=2) {
                  out = true;
               }
            }
         }

         if(motionValue>=40 && motionValue<80){
            if(character.currentLane <= -2 || character.currentLane>=2)
               out = true;
         }


         if(motionValue>=80)
         {
            motionValue = 0;
         }

			// Make the character move according to the controls.
			character.update();
			ground.update();

			// Check for collisions between the character and objects.
			if (collisionsDetected() || out) {
				gameOver = true;
				paused = true;	
				runningaction.stop();
				document.addEventListener(
        			'keydown',
        			function(e) {	
        				if (e.keyCode == 13)
            			document.location.reload(true);
        			}
    			);
    			var variableContent = document.getElementById("variable-content");
    			variableContent.style.visibility = "visible";
    			variableContent.innerHTML = 
    				"Game over! Press enter to try again.";
			}

			// Update the scores.
			score += 10;
			// Update the motionValue
			motionValue += 0.1;
			document.getElementById("score").innerHTML = score;
		}

		camera.position.set(cameraX, cameraY, cameraZ);
		var delta = clock.getDelta();
		if ( mixer ) mixer.update( delta );
		// Render the page and repeat.
		renderer.render(scene, camera);
		requestAnimationFrame(loop);


	} //end loop

	/**
	  * A method called when window is resized.
	  */
	function handleWindowResize() {
		renderer.setSize(element.clientWidth, element.clientHeight);
		camera.aspect = element.clientWidth / element.clientHeight;
		camera.updateProjectionMatrix();
	}

	/**
	 * Creates and returns a row of trees according to the specifications.
	 *
	 * @param {number} POSITION The z-position of the row of trees.
 	 * @param {number} PROBABILITY The probability that a given lane in the row
 	 *                             has a tree.
 	 * @param {number} MINSCALE The minimum size of the trees. The trees have a 
 	 *							uniformly distributed size from minScale to maxScale.
 	 * @param {number} MAXSCALE The maximum size of the trees.
 	 *
	 */
	function createRowOfTrees(position, probability, minScale, maxScale) {
		for (var lane = -1; lane < 2; lane++) {
			var randomNumber = Math.random();
			if (randomNumber < probability) {
				var scale = minScale + (maxScale - minScale) * Math.random();
				var tree = new Tree(lane * 800, -400, position, scale);
				objects.push(tree);
				scene.add(tree.mesh);
			}
		}
	}

	/**
	 * Returns true if and only if the character is currently colliding with
	 * an object on the map.
	 */
 	function collisionsDetected() {
 		var charMinX = runningCharacter.position.x - 115;
 		var charMaxX = runningCharacter.position.x + 115;
 		var charMinY = runningCharacter.position.y - 310;
 		var charMaxY = runningCharacter.position.y + 320;
 		var charMinZ = runningCharacter.position.z - 40;
 		var charMaxZ = runningCharacter.position.z + 40;
 		for (var i = 0; i < objects.length; i++) {
 			if (objects[i].collides(charMinX, charMaxX, charMinY, 
 					charMaxY, charMinZ, charMaxZ)) {
 				return true;
 			}
 		}
 		return false;
 	}
	
}

function rCharacter() {

	// Explicit binding of this even in changing contexts.
	var self = this;

	// Character defaults that don't change throughout the game.

	this.jumpDuration = 0.6;
	this.jumpHeight = 2000;

	// Initialize the character.
	init();

	function init() {

		// Initialize the player's changing parameters.
		self.isJumping = false;
		self.isSwitchingLeft = false;
		self.isSwitchingRight = false;
		self.currentLane = 0;
		self.runningStartTime = new Date() / 1000;
		self.pauseStartTime = new Date() / 1000;
		self.stepFreq = 2;
		self.queuedActions = [];

	}
	
	/**
	 * A method called on the character when time moves forward.
	 */
	this.update = function() {

		// Obtain the curren time for future calculations.
		var currentTime = new Date() / 1000;

		if (!self.isJumping &&
			!self.isSwitchingLeft &&
			!self.isSwitchingRight &&
			self.queuedActions.length > 0) {
			switch(self.queuedActions.shift()) {
				case "up":
					self.isJumping = true;
					self.jumpStartTime = new Date() / 1000;
					break;
				case "left":
					if (self.currentLane != -2) {
						self.isSwitchingLeft = true;
					}
					break;
				case "right":
					if (self.currentLane != 2) {
						self.isSwitchingRight = true;
					}
					break;
			}
		}

		// If the character is jumping, update the height of the character.
		// Otherwise, the character continues running.
		if (self.isJumping) {
			var jumpClock = currentTime - self.jumpStartTime;
			runningCharacter.position.y = self.jumpHeight * Math.sin(
				(1 / self.jumpDuration) * Math.PI * jumpClock) +
				sinusoid(2 * self.stepFreq, 0, 20, 0,
					self.jumpStartTime - self.runningStartTime);
			runningaction.stop();
			if (jumpClock > self.jumpDuration) {
				self.isJumping = false;
				self.runningStartTime += self.jumpDuration;
				runningaction.play();
			}
		} else {
			var runningClock = currentTime - self.runningStartTime;
			
			
			// If the character is not jumping, it may be switching lanes.
			if (self.isSwitchingLeft) {
				runningCharacter.position.x -= 200;
				var offset = self.currentLane * 800 - runningCharacter.position.x;
				if (offset > 800) {
					self.currentLane -= 1;
					runningCharacter.position.x = self.currentLane * 800;
					self.isSwitchingLeft = false;
				}
			}
			if (self.isSwitchingRight) {
				runningCharacter.position.x += 200;
				var offset = runningCharacter.position.x - self.currentLane * 800;
				if (offset > 800) {
					self.currentLane += 1;
					runningCharacter.position.x = self.currentLane * 800;
					self.isSwitchingRight = false;
				}
			}
		}
	}

	/**
	  * Handles character activity when the left key is pressed.
	  */
	this.onLeftKeyPressed = function() {
		self.queuedActions.push("left");
	}

	/**
	  * Handles character activity when the up key is pressed.
	  */
	this.onUpKeyPressed = function() {
		self.queuedActions.push("up");
	}

	/**
	  * Handles character activity when the right key is pressed.
	  */
	this.onRightKeyPressed = function() {
		self.queuedActions.push("right");
	}

	/**
	  * Handles character activity when the game is paused.
	  */
	this.onPause = function() {
		self.pauseStartTime = new Date() / 1000;
		runningaction.stop();
	}

	/**
	  * Handles character activity when the game is unpaused.
	  */
	this.onUnpause = function() {
		var currentTime = new Date() / 1000;
		var pauseDuration = currentTime - self.pauseStartTime;
		self.runningStartTime += pauseDuration;
		runningaction.play();
		if (self.isJumping) {
			self.jumpStartTime += pauseDuration;
		}
	}

	this.onWKeyPressed = function() {
		cameraY += 200;
	};

	this.onSKeyPressed = function() {
		cameraY -= 200;
	};

	this.onAKeyPressed = function() {
		cameraX -= 200;
	};

	this.onDKeyPressed = function() {
		cameraX += 200;
	};

	this.onQKeyPressed = function() {
		cameraZ += 200;
	};

	this.onEKeyPressed = function() {
		cameraZ -= 200;
	};

	this.on1KeyPressed = function() {
		cameraX = 0;
		cameraY = 500;
		cameraZ = -2500;

	};

	this.on2KeyPressed = function() {
		cameraX = 0;
		cameraY = 3000;
		cameraZ = 3000;	
	};

	this.on3KeyPressed = function() {
		cameraX = -3000;
		cameraY = 3000;
		cameraZ = 3000;		
	};

	this.on4KeyPressed = function() {
		cameraX = 3000;
		cameraY = 3000;
		cameraZ = 3000;	
	};

	this.on5KeyPressed = function() {
		cameraX = 0;
		cameraY = 1500;
		cameraZ = -1000;		
	};
}

/**
  * A collidable tree in the game positioned at X, Y, Z in the scene and with
  * scale S.
  */
function Tree(x, y, z, s) {

	// Explicit binding.
	var self = this;

   // The object portrayed in the scene.
   this.mesh = new THREE.Object3D();
    var top = createTree(1, 300, 300, 4, Colors.white, 0, 1000, 0);
    var mid = createTree(1, 400, 400, 4, Colors.white, 0, 800, 0);
    var bottom = createTree(1, 500, 500, 4, Colors.white, 0, 500, 0);
    var trunk = createTrunck(100, 100, 250, 32, Colors.brown, 0, 125, 0);
    this.mesh.add(top);
    this.mesh.add(mid);
    this.mesh.add(bottom);
    this.mesh.add(trunk);
    this.mesh.position.set(x, y, z);
   this.mesh.scale.set(s, s, s);
   this.scale = s;

	/**
	 * A method that detects whether this tree is colliding with the character,
	 * which is modelled as a box bounded by the given coordinate space.
	 */
    this.collides = function(minX, maxX, minY, maxY, minZ, maxZ) {
    	var treeMinX = self.mesh.position.x - this.scale * 250;
    	var treeMaxX = self.mesh.position.x + this.scale * 250;
    	var treeMinY = self.mesh.position.y;
    	var treeMaxY = self.mesh.position.y + this.scale * 1150;
    	var treeMinZ = self.mesh.position.z - this.scale * 250;
    	var treeMaxZ = self.mesh.position.z + this.scale * 250;
    	return treeMinX <= maxX && treeMaxX >= minX
    		&& treeMinY <= maxY && treeMaxY >= minY
    		&& treeMinZ <= maxZ && treeMaxZ >= minZ;
    }

}

/** 
 *
 * UTILITY FUNCTIONS
 * 
 * Functions that simplify and minimize repeated code.
 *
 */

/**
 * Utility function for generating current values of sinusoidally
 * varying variables.
 *
 * @param {number} FREQUENCY The number of oscillations per second.
 * @param {number} MINIMUM The minimum value of the sinusoid.
 * @param {number} MAXIMUM The maximum value of the sinusoid.
 * @param {number} PHASE The phase offset in degrees.
 * @param {number} TIME The time, in seconds, in the sinusoid's scope.
 * @return {number} The value of the sinusoid.
 *
 */
function sinusoid(frequency, minimum, maximum, phase, time) {
	var amplitude = 0.5 * (maximum - minimum);
	var angularFrequency = 2 * Math.PI * frequency;
	var phaseRadians = phase * Math.PI / 180;
	var offset = amplitude * Math.sin(
		angularFrequency * time + phaseRadians);
	var average = (minimum + maximum) / 2;
	return average + offset;
}


 function createGround(dx, dy, dz, map, x, y, z, notFlatShading) {

	const loader = new THREE.TextureLoader();

    const materials = [
    new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/19670/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260')}),
    new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/19670/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260')}),
    new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/19670/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260')}),
    new THREE.MeshBasicMaterial({map: loader.load('https://images.pexels.com/photos/19670/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260')}),

  ];

    var geom = new THREE.BoxGeometry(dx, dy, dz);

    var box = new THREE.Mesh(geom, materials);

    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set(x, y, z);
    return box;
}

function createBox(dx, dy, dz, color, x, y, z, notFlatShading) {
    var geom = new THREE.BoxGeometry(dx, dy, dz);
    var mat = new THREE.MeshPhongMaterial({
        color: color,
        flatShading: notFlatShading != true
    });
    var box = new THREE.Mesh(geom, mat);
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set(x, y, z);
    return box;
}

/**
 * Creates and returns a (possibly asymmetrical) cyinder with the 
 * specified properties.
 */

function createTree(radiusTop, radiusBottom, height, radialSegments, 
						map, x, y, z) {
	var loader = new THREE.TextureLoader();
    var geom = new THREE.CylinderGeometry(
    	radiusTop, radiusBottom, height, radialSegments);
    var mat = new THREE.MeshPhongMaterial({
	map: loader.load('tree.jpg'),
    	flatShading: true
    });
    var cylinder = new THREE.Mesh(geom, mat);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.set(x, y, z);
    return cylinder;
}

function createTrunck(radiusTop, radiusBottom, height, radialSegments, 
						map, x, y, z) {
	var loader = new THREE.TextureLoader();
    var geom = new THREE.CylinderGeometry(
    	radiusTop, radiusBottom, height, radialSegments);
    var mat = new THREE.MeshPhongMaterial({
		color: map,
		flatShading: true
    });
    var cylinder = new THREE.Mesh(geom, mat);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.set(x, y, z);
    return cylinder;
}


function Ground () {

   var self = this;

   init();

   function init() {   

      self.element = createGround(3000, 20, 120000, Colors.grey, 0, -400, -60000);
      self.isSwitchingLeft = false;
      self.isSwitchingRight = false;
      self.queuedActions = [];
   }

   this.update = function() {

      if (!self.isSwitchingLeft &&
         !self.isSwitchingRight &&
         self.queuedActions.length > 0) {
         switch(self.queuedActions.shift()) {
            case "left":
               self.isSwitchingLeft = true;
               break;
            case "right":
               self.isSwitchingRight = true;
               break;
         }
      }

      if(self.isSwitchingLeft){
         self.element.position.x -= 10;
         self.isSwitchingLeft = false;
      }
      if(self.isSwitchingRight){
         self.element.position.x += 10;
         self.isSwitchingRight = false;
      }
   }

   this.onLeft = function() {
      self.queuedActions.push("left");
   }

   this.onRight = function() {
      self.queuedActions.push("right");
   }

}