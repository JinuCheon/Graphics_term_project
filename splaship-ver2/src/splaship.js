window.addEventListener('load', init, false);

var sceneWidth;
var sceneHeight;
var camera;
var scene;
var renderer;
var dom;
var sun;
var ground;
var orbitControl;
var rollingGroundSphere;
var heroSphere;
var rollingSpeed = 0.005;
var worldRadius = 26;
var sphericalHelper;
var pathAngleValues;
var heroBaseY = 1.6;
var bounceValue = 0.1;
var gravity = 0.005;
var leftLane = -1;
var rightLane = 1;
var middleLane = 0;
var currentLane;
var clock;
var levelClock;
var jumping;
var rockReleaseInterval = 0.5;
var lastRockReleaseTime = 0;
var rocksInPath;
var rocksPool;
var particleGeometry;
var particleCount = 70;
var splashGeometry;
var splashCount = 15;
var splashParticles;
var explosionPower = 1.06;
var particles;
var scoreText;
var score = 0;
var light;
var water;
var splashGap = 40;

var flag = 0;
var animationFrame;
var life = 3;
var godMode = false;
var continueAnimate = true;

var scoreList;

function init() {
    createScene();
    getTopScore();
    update();
}

function createScene() {
    rocksInPath = [];
    rocksPool = [];
    clock = new THREE.Clock();
    clock.start();
    levelClock = new THREE.Clock();
    levelClock.start();
    sphericalHelper = new THREE.Spherical();
    pathAngleValues = [1.52, 1.57, 1.62];
    sceneWidth = window.innerWidth;
    sceneHeight = window.innerHeight;
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0x424242, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(sceneWidth, sceneHeight);
    dom = document.getElementById('TutContainer');
    dom.appendChild(renderer.domElement);
    createRocksPool();
    addHero();
    addLight();
    addWorld();
    addSky();
    addExplosion();
    addSplash();
    addCamera();
    addScoreBox();
    addLifeBox();
    addRankingBox();

    window.addEventListener('resize', onWindowResize, false);
    document.onkeydown = handleKeyDown;
}

function addLifeBox() {
    lifeText = document.createElement('div');
    lifeText.style.color = 'red';
    lifeText.style.fontSize = '30px';
    lifeText.style.textAlign = 'center';
    lifeText.style.fontWeight = 'bold';
    lifeText.style.textShadow = '4px 4px 4px black';
    lifeText.style.position = 'absolute';
    lifeText.style.width = '100%';
    lifeText.style.height = 100;
    lifeText.innerHTML = "❤ ❤ ❤";
    lifeText.style.top = 120 + 'px';
    document.body.appendChild(lifeText);
}

function addScoreBox() {
    scoreText = document.createElement('div');
    scoreText.style.color = 'white';
    scoreText.style.fontSize = '80px';
    scoreText.style.textAlign = 'center';
    scoreText.style.fontWeight = 'bold';
    scoreText.style.textShadow = '4px 4px 4px black';
    scoreText.style.position = 'absolute';
    scoreText.style.width = '100%';
    scoreText.style.height = 100;
    scoreText.innerHTML = "Score : 0";
    scoreText.style.top = 30 + 'px';
    document.body.appendChild(scoreText);
}

function addRankingBox() {
    rankText = document.createElement('div');
    rankText.style.color = 'white'
    rankText.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    rankText.style.position = 'absolute';
    rankText.style.width = 100;
    rankText.style.height = 100;
    rankText.innerHTML = "<p>scoreboard</p>";
    rankText.style.top = 0 + 'px';
    rankText.style.left = 0 + 'px';
	rankText.id = 'rankBox';
    document.body.appendChild(rankText);
}

function addCamera() {
    camera = new THREE.PerspectiveCamera(70, sceneWidth / sceneHeight, 0.1, 5000000);
    camera.position.z = 6.5;
    camera.position.y = 3.5;
    orbitControl = new THREE.OrbitControls(camera, renderer.domElement);
    orbitControl.addEventListener('change', render);
    orbitControl.noKeys = true;
    orbitControl.noPan = false;
    orbitControl.enableZoom = false;
    orbitControl.enablePan = false;
    orbitControl.enableRotate = false;
}

function addSky() {
    var aCubeMap = THREE.ImageUtils.loadTextureCube([
        'assets/img/px.jpg',
        'assets/img/nx.jpg',
        'assets/img/py.jpg',
        'assets/img/ny.jpg',
        'assets/img/pz.jpg',
        'assets/img/nz.jpg'
    ]);
    aCubeMap.format = THREE.RGBFormat;

    var aShader = THREE.ShaderLib['cube'];
    aShader.uniforms['tCube'].value = aCubeMap;

    var aSkyBoxMaterial = new THREE.ShaderMaterial({
        fragmentShader: aShader.fragmentShader,
        vertexShader: aShader.vertexShader,
        uniforms: aShader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    });

    var aSkybox = new THREE.Mesh(
        new THREE.BoxGeometry(1000000, 1000000, 1000000),
        aSkyBoxMaterial
    );

    scene.add(aSkybox);
}

function addExplosion() {
    particleGeometry = new THREE.Geometry();
    for (var i = 0; i < particleCount; i++) {
        var vertex = new THREE.Vector3();
        particleGeometry.vertices.push(vertex);
    }
    var pMaterial = new THREE.ParticleBasicMaterial({
        color: 0x6F0800,
        size: 0.05
    });
    particles = new THREE.Points(particleGeometry, pMaterial);
    scene.add(particles);
    particles.visible = false;
}

function addSplash() {
    splashGeometry = new THREE.Geometry();
    for (var i = 0; i < splashCount; i++) {
        var vertex = new THREE.Vector3();
        splashGeometry.vertices.push(vertex);
    }
    var sMaterial = new THREE.ParticleBasicMaterial({
        color: 0x04a1bf,
        size: 0.08
    });
    splashParticles = new THREE.Points(splashGeometry, sMaterial);
    scene.add(splashParticles);
    splashParticles.visible = false;
}

function createRocksPool() {
    var maxRocksInPool = 10;
    var newRock;
    for (var i = 0; i < maxRocksInPool; i++) {
        newRock = createRock();
        rocksPool.push(newRock);
    }
}

function handleKeyDown(keyEvent) {
    if (jumping) return;
    shipSplash();
    var validMove = true;
    if (keyEvent.keyCode === 37) {
        if (currentLane == middleLane) {
            currentLane = leftLane;
        } else if (currentLane == rightLane) {
            currentLane = middleLane;
        } else {
            validMove = false;
        }
    } else if (keyEvent.keyCode === 39) {
        if (currentLane == middleLane) {
            currentLane = rightLane;
        } else if (currentLane == leftLane) {
            currentLane = middleLane;
        } else {
            validMove = false;
        }
    }
    if (validMove) {
        jumping = true;
    }
}
function addHero() {
    var sphereGeometry = new THREE.TetrahedronBufferGeometry(0.4);
    var sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0001, shading: THREE.FlatShading })
    jumping = false;
    heroSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    heroSphere.rotateX(45 * Math.PI / 180);
    heroSphere.rotateY(45 * Math.PI / 180);
    heroSphere.receiveShadow = true;
    heroSphere.castShadow = true;

    const reactorSocketGeometry = new THREE.CylinderBufferGeometry(0.08, 0.08, 0.1, 16);
    const reactorSocketMaterial = new THREE.MeshBasicMaterial({ color: 0x99aacc });

    const reactorSocket1 = new THREE.Mesh(reactorSocketGeometry, reactorSocketMaterial);
    const reactorSocket2 = new THREE.Mesh(reactorSocketGeometry, reactorSocketMaterial);

    heroSphere.add(reactorSocket1);
    heroSphere.add(reactorSocket2);

    reactorSocket1.rotateX(45 * Math.PI / 180);
    reactorSocket1.rotateZ(45 * Math.PI / 180);
    reactorSocket1.position.set(-0.2, 0.15, 0);
    reactorSocket2.rotateX(45 * Math.PI / 180);
    reactorSocket2.rotateZ(45 * Math.PI / 180);
    reactorSocket2.position.set(0, 0.15, 0.2);


    scene.add(heroSphere);

    heroSphere.position.y = heroBaseY;
    heroSphere.position.z = 4.8;
    currentLane = middleLane;
    heroSphere.position.x = currentLane;
}

function addWorld() {
    var sides = 27;
    var tiers = 15;
    var sphereGeometry = new THREE.SphereGeometry(worldRadius, sides, tiers);

    var vertexIndex;
    var vertexVector = new THREE.Vector3();
    var nextVertexVector = new THREE.Vector3();
    var firstVertexVector = new THREE.Vector3();
    var offset = new THREE.Vector3();
    var currentTier = 1;
    var lerpValue = 0.5;
    var heightValue;
    var maxHeight = 0.07;
    for (var j = 1; j < tiers - 2; j++) {
        currentTier = j;
        for (var i = 0; i < sides; i++) {
            vertexIndex = (currentTier * sides) + 1;
            vertexVector = sphereGeometry.vertices[i + vertexIndex].clone();
            if (j % 2 !== 0) {
                if (i == 0) {
                    firstVertexVector = vertexVector.clone();
                }
                nextVertexVector = sphereGeometry.vertices[i + vertexIndex + 1].clone();
                if (i == sides - 1) {
                    nextVertexVector = firstVertexVector;
                }
                lerpValue = (Math.random() * (0.75 - 0.25)) + 0.25;
                vertexVector.lerp(nextVertexVector, lerpValue);
            }
            heightValue = (Math.random() * maxHeight) - (maxHeight / 2);
            offset = vertexVector.clone().normalize().multiplyScalar(heightValue);
            sphereGeometry.vertices[i + vertexIndex] = (vertexVector.add(offset));
        }
    }

    var waterNormals = new THREE.ImageUtils.loadTexture('assets/img/waternormals.jpg');
    waterNormals.wrapS = THREE.RepeatWrapping;
    waterNormals.wrapT = THREE.RepeatWrapping;

    water = new THREE.Water(renderer, camera, scene, {
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: waterNormals,
        alpha: 1.0,
        sunDirection: sun.position.normalize(),
        sunColor: 0xf9d71c,
        waterColor: 0x259faf,
        distortionScale: 50.0
    });

    rollingGroundSphere = new THREE.Mesh(sphereGeometry, water.material);
    rollingGroundSphere.add(water);
    rollingGroundSphere.rotation.x = - Math.PI * 0.5;
    rollingGroundSphere.receiveShadow = true;
    rollingGroundSphere.castShadow = false;
    rollingGroundSphere.rotation.z = -Math.PI / 2;
    scene.add(rollingGroundSphere);
    rollingGroundSphere.position.y = -24;
    rollingGroundSphere.position.z = 2;
    addWorldRocks();
}
function addLight() {
    light = new THREE.HemisphereLight(0x57b8bc, 0x000000, .4)
    scene.add(light);
    sun = new THREE.DirectionalLight(0x57b8bc, 3);
    sun.position.set(-600, 300, 600);
    sun.castShadow = true;
    scene.add(sun);
    sun.shadow.mapSize.width = 256;
    sun.shadow.mapSize.height = 256;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
}


function addWorldRocks() {
    var numRocks = 36;
    var gap = 6.28 / 36;
    for (var i = 0; i < numRocks; i++) {
        addRock(false, i * gap, true);
        addRock(false, i * gap, false);
    }
}

function addRock(inPath, row, isLeft) {
    var newRock;
    if (inPath) {
        if (rocksPool.length == 0) return;
        newRock = rocksPool.pop();
        newRock.visible = true;
        rocksInPath.push(newRock);
        sphericalHelper.set(worldRadius - 0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x + 4);
    } else {
        newRock = createRock();
        var forestAreaAngle = 0;
        if (isLeft) {
            forestAreaAngle = 1.68 + Math.random() * 0.1;
        } else {
            forestAreaAngle = 1.46 - Math.random() * 0.1;
        }
        sphericalHelper.set(worldRadius - 0.3, forestAreaAngle, row);
    }
    newRock.position.setFromSpherical(sphericalHelper);
    var rollingGroundVector = rollingGroundSphere.position.clone().normalize();
    var rockVector = newRock.position.clone().normalize();
    newRock.quaternion.setFromUnitVectors(rockVector, rollingGroundVector);
    newRock.rotation.x += (Math.random() * (2 * Math.PI / 10)) + -Math.PI / 10;

    rollingGroundSphere.add(newRock);
}
function createRock() {
    var sides = 8;
    var tiers = 6;
    var scalarMultiplier = (Math.random() * (0.25 - 0.1)) + 0.05;
    var rockGeometry = new THREE.ConeGeometry(0.5, 1, sides, tiers);
    var rockMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, shading: THREE.FlatShading });
    midPointVector = rockGeometry.vertices[0].clone();
    blowUpRock(rockGeometry.vertices, sides, 0, scalarMultiplier);
    tightenRock(rockGeometry.vertices, sides, 1);
    var rockTop = new THREE.Mesh(rockGeometry, rockMaterial);
    rockTop.castShadow = true;
    rockTop.receiveShadow = false;
    rockTop.position.y = 0.2;
    rockTop.rotation.y = (Math.random() * (Math.PI));
    var rock = new THREE.Object3D();
    rock.add(rockTop);
    return rock;
}

function blowUpRock(vertices, sides, currentTier, scalarMultiplier, odd) {
    var vertexIndex;
    var vertexVector = new THREE.Vector3();
    var midPointVector = vertices[0].clone();
    var offset;
    for (var i = 0; i < sides; i++) {
        vertexIndex = (currentTier * sides) + 1;
        vertexVector = vertices[i + vertexIndex].clone();
        midPointVector.y = vertexVector.y;
        offset = vertexVector.sub(midPointVector);
        if (odd) {
            if (i % 2 === 0) {
                offset.normalize().multiplyScalar(scalarMultiplier / 6);
                vertices[i + vertexIndex].add(offset);
            } else {
                offset.normalize().multiplyScalar(scalarMultiplier);
                vertices[i + vertexIndex].add(offset);
                vertices[i + vertexIndex].y = vertices[i + vertexIndex + sides].y + 0.05;
            }
        } else {
            if (i % 2 !== 0) {
                offset.normalize().multiplyScalar(scalarMultiplier / 6);
                vertices[i + vertexIndex].add(offset);
            } else {
                offset.normalize().multiplyScalar(scalarMultiplier);
                vertices[i + vertexIndex].add(offset);
                vertices[i + vertexIndex].y = vertices[i + vertexIndex + sides].y + 0.05;
            }
        }
    }
}
function tightenRock(vertices, sides, currentTier) {
    var vertexIndex;
    var vertexVector = new THREE.Vector3();
    var midPointVector = vertices[0].clone();
    var offset;
    for (var i = 0; i < sides; i++) {
        vertexIndex = (currentTier * sides) + 1;
        vertexVector = vertices[i + vertexIndex].clone();
        midPointVector.y = vertexVector.y;
        offset = vertexVector.sub(midPointVector);
        offset.normalize().multiplyScalar(0.06);
        vertices[i + vertexIndex].sub(offset);
    }
}

function update() {
    if (!continueAnimate) return;

    rollingGroundSphere.rotation.x += rollingSpeed;
    if (heroSphere.position.y <= heroBaseY) {
        jumping = false;
        bounceValue = (Math.random() * 0.04) + 0.005;
    }
    heroSphere.position.y += bounceValue;
    heroSphere.position.x = THREE.Math.lerp(heroSphere.position.x, currentLane, 2 * clock.getDelta());
    bounceValue -= gravity;
    if (levelClock.getElapsedTime() > 3) {
        levelClock.start();
        rockReleaseInterval -= 0.04;
        rollingSpeed += 0.0003
    }
    if (clock.getElapsedTime() > rockReleaseInterval) {
        clock.start();
        var options = [0, 1, 2];
        var lane = Math.floor(Math.random() * 3);
        addRock(true, lane);
        options.splice(lane, 1);
        if (Math.random() > 0.5) {
            lane = Math.floor(Math.random() * 2);
            addRock(true, options[lane]);
        }
        score += 1;
        scoreText.innerHTML = `Score : ` + score.toString();
    }
    water.material.uniforms.time.value += 1.0 / 100.0;
    doRockLogic();
    doExplosionLogic();
    doSplashLogic();
    if (flag == splashGap) {
        shipSplash();
        flag = 0;
    }
    else flag++;
    render();
    animationFrame = requestAnimationFrame(update);
}
function doRockLogic() {
    var oneRock;
    var rockPos = new THREE.Vector3();
    var rocksToRemove = [];
    rocksInPath.forEach(function (element, index) {
        oneRock = rocksInPath[index];
        rockPos.setFromMatrixPosition(oneRock.matrixWorld);
        if (rockPos.z > 6 && oneRock.visible) {
            rocksToRemove.push(oneRock);
        } else {
            if (!godMode && rockPos.distanceTo(heroSphere.position) <= 0.6) {
                explode();
                if(life > 1) {
                    life--;
                    var tempText = '';
                    for(var i=0;i<life;i++) {
                        tempText += "❤ ";
                    }
                    lifeText.innerHTML = tempText;
                    godMode = true;
                    setTimeout(() => {
                        godMode = false;
                    }, 2000);
                } else {
                    lifeText.innerHTML = ' ';
                    continueAnimate = false;
                    gameOver();
                }
            }
        }
    });
    var fromWhere;
    rocksToRemove.forEach(function (element, index) {
        oneRock = rocksToRemove[index];
        fromWhere = rocksInPath.indexOf(oneRock);
        rocksInPath.splice(fromWhere, 1);
        rocksPool.push(oneRock);
        oneRock.visible = false;
    });
}
function doExplosionLogic() {
    if (!particles.visible) return;
    for (var i = 0; i < particleCount; i++) {
        particleGeometry.vertices[i].multiplyScalar(explosionPower);
    }
    if (explosionPower > 1.005) {
        explosionPower -= 0.001;
    } else {
        particles.visible = false;
    }
    particleGeometry.verticesNeedUpdate = true;
}
function doSplashLogic() {
    if (!splashParticles.visible) return;
    for (var i = 0; i < splashCount; i++) {
        splashGeometry.vertices[i].multiplyScalar(explosionPower);
    }
    if (explosionPower > 1.005) {
        explosionPower -= 0.001;
    } else {
        splashParticles.visible = false;
    }
    splashGeometry.verticesNeedUpdate = true;
}
function explode() {
    particles.position.y = 2;
    particles.position.z = 4.8;
    particles.position.x = heroSphere.position.x;
    for (var i = 0; i < particleCount; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = -0.2 + Math.random() * 0.4;
        vertex.y = -0.2 + Math.random() * 0.4;
        vertex.z = -0.2 + Math.random() * 0.4;
        particleGeometry.vertices[i] = vertex;
    }
    explosionPower = 1.07;
    particles.visible = true;
}
function shipSplash() {
    splashParticles.position.y = 2;
    splashParticles.position.z = 5;
    splashParticles.position.x = heroSphere.position.x;
    for (var i = 0; i < splashCount; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = -0.2 + Math.random() * 0.4;
        vertex.y = -0.4 + Math.random() * 0.3;
        vertex.z = -0.2 + Math.random() * 0.4;
        splashGeometry.vertices[i] = vertex;
    }
    explosionPower = 1.07;
    splashParticles.visible = true;
}
function render() {
    water.render();
    renderer.render(scene, camera);
}
function gameOver() {
    cancelAnimationFrame(animationFrame);

    if (scoreList == null) {
        window.alert("Cannot connect to server.");
        window.location.reload(window.location.href);
    }

    if (score > scoreList[9].score) {
        var nickname = window.prompt(`point: ${score}\ntop 10 달성. 닉네임을 입력하세요`, "Unknown");
        if (nickname != null) {
            setNewScore(nickname, score);
        }
    } else {
        window.alert("다시 시도해보세요!");
    }
    window.location.reload(window.location.href);
}

function onWindowResize() {
    sceneHeight = window.innerHeight;
    sceneWidth = window.innerWidth;
    renderer.setSize(sceneWidth, sceneHeight);
    camera.aspect = sceneWidth / sceneHeight;
    camera.updateProjectionMatrix();
}
