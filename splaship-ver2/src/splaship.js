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
var rollingSpeed=0.01;
var heroRollingSpeed;
var worldRadius=26;
var heroRadius=0.2;
var sphericalHelper;
var pathAngleValues;
var heroBaseY=1.8;
var bounceValue=0.05;
var gravity=0.005;
var leftLane=-1;
var rightLane=1;
var middleLane=0;
var currentLane;
var clock;
var levelClock;
var jumping;
var treeReleaseInterval=0.5;
var lastTreeReleaseTime=0;
var treesInPath;
var treesPool;
var particleGeometry;
var particleCount=20;
var explosionPower =1.06;
var particles;
var scoreText;
var score;
var hasCollided;
var light;
var water;

function init() {
	// set up the scene
	createScene();

	//call game loop
	update();
}

function createScene(){
	hasCollided=false;
	score=0;
	treesInPath=[];
	treesPool=[];
	clock=new THREE.Clock();
	clock.start();
	levelClock = new THREE.Clock();
	levelClock.start();
	heroRollingSpeed=(rollingSpeed*worldRadius/heroRadius)/5;
	sphericalHelper = new THREE.Spherical();
	pathAngleValues=[1.52,1.57,1.62];
    sceneWidth=window.innerWidth;
    sceneHeight=window.innerHeight;
    scene = new THREE.Scene();//the 3d scene
    scene.fog = new THREE.FogExp2( 0xf0fff0, 0.14 );
    camera = new THREE.PerspectiveCamera( 70, sceneWidth / sceneHeight, 0.1, 5000000 );//perspective camera
    renderer = new THREE.WebGLRenderer({alpha:true});//renderer with transparent backdrop
    renderer.setClearColor(0x424242, 1); 
    renderer.shadowMap.enabled = true;//enable shadow
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize( sceneWidth, sceneHeight );
    dom = document.getElementById('TutContainer');
	dom.appendChild(renderer.domElement);
	createTreesPool();
	addHero();
	addLight();
	addWorld();
	addSky();
	addExplosion();
	
	camera.position.z = 6.5;
	camera.position.y = 3.5;
	orbitControl = new THREE.OrbitControls( camera, renderer.domElement );//helper to rotate around in scene
	orbitControl.addEventListener( 'change', render );
	// orbitControl.enableDamping = true;
	// orbitControl.dampingFactor = 0.8;
	// orbitControl.noKeys = true;
	// orbitControl.noPan = true;
	// orbitControl.enableZoom = false;
	// orbitControl.minPolarAngle = 1.1;
	// orbitControl.maxPolarAngle = 1.1;
	// orbitControl.minAzimuthAngle = -0.2;
	// orbitControl.maxAzimuthAngle = 0.2;
	
	window.addEventListener('resize', onWindowResize, false);//resize callback

	document.onkeydown = handleKeyDown;
	
	scoreText = document.createElement('div');
	scoreText.style.position = 'absolute';
	//text2.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
	scoreText.style.width = 100;
	scoreText.style.height = 100;
	//scoreText.style.backgroundColor = "blue";
	scoreText.innerHTML = "0";
	scoreText.style.top = 10 + 'px';
	scoreText.style.left = 100 + 'px';
	document.body.appendChild(scoreText);
	
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

function addExplosion(){
	particleGeometry = new THREE.Geometry();
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		particleGeometry.vertices.push( vertex );
	}
	var pMaterial = new THREE.ParticleBasicMaterial({
	  color: 0xfffafa,
	  size: 0.2
	});
	particles = new THREE.Points( particleGeometry, pMaterial );
	scene.add( particles );
	particles.visible=false;
}

function createTreesPool(){
	var maxTreesInPool=10;
	var newTree;
	for(var i=0; i<maxTreesInPool;i++){
		newTree=createTree();
		treesPool.push(newTree);
	}
}

function handleKeyDown(keyEvent){
	if(jumping)return;
	var validMove=true;
	if ( keyEvent.keyCode === 37) {//left
		if(currentLane==middleLane){
			currentLane=leftLane;
		}else if(currentLane==rightLane){
			currentLane=middleLane;
		}else{
			validMove=false;	
		}
	} else if ( keyEvent.keyCode === 39) {//right
		if(currentLane==middleLane){
			currentLane=rightLane;
		}else if(currentLane==leftLane){
			currentLane=middleLane;
		}else{
			validMove=false;	
		}
	}
	if(validMove){
		jumping=true;
	}
}
function addHero(){
	var sphereGeometry = new THREE.DodecahedronGeometry( heroRadius, 1);
	var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xe5f2f2 ,shading:THREE.FlatShading} )
	jumping=false;
	heroSphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
	heroSphere.receiveShadow = true;
	heroSphere.castShadow=true;
	scene.add( heroSphere );
	heroSphere.position.y=heroBaseY;
	heroSphere.position.z=4.8;
	currentLane=middleLane;
	heroSphere.position.x=currentLane;
}
function addWorld(){
	var sides=27;
	var tiers=15;
	var sphereGeometry = new THREE.SphereGeometry( worldRadius, sides,tiers);
	
	var vertexIndex;
	var vertexVector= new THREE.Vector3();
	var nextVertexVector= new THREE.Vector3();
	var firstVertexVector= new THREE.Vector3();
	var offset= new THREE.Vector3();
	var currentTier=1;
	var lerpValue=0.5;
	var heightValue;
	var maxHeight=0.07;
	for(var j=1;j<tiers-2;j++){
		currentTier=j;
		for(var i=0;i<sides;i++){
			vertexIndex=(currentTier*sides)+1;
			vertexVector=sphereGeometry.vertices[i+vertexIndex].clone();
			if(j%2!==0){
				if(i==0){
					firstVertexVector=vertexVector.clone();
				}
				nextVertexVector=sphereGeometry.vertices[i+vertexIndex+1].clone();
				if(i==sides-1){
					nextVertexVector=firstVertexVector;
				}
				lerpValue=(Math.random()*(0.75-0.25))+0.25;
				vertexVector.lerp(nextVertexVector,lerpValue);
			}
			heightValue=(Math.random()*maxHeight)-(maxHeight/2);
			offset=vertexVector.clone().normalize().multiplyScalar(heightValue);
			sphereGeometry.vertices[i+vertexIndex]=(vertexVector.add(offset));
		}
	}

	var waterNormals = new THREE.ImageUtils.loadTexture('assets/img/waternormals.jpg');
	waterNormals.wrapS = THREE.RepeatWrapping;
	waterNormals.wrapT = THREE.RepeatWrapping;
	
	// Create the water effect
	water = new THREE.Water(renderer, camera, scene, {
		textureWidth: 1024, 
		textureHeight: 1024,
		waterNormals: waterNormals,
		alpha: 	1.0,
		sunDirection: sun.position.normalize(),
		sunColor: 0xffffff,
		waterColor: 0x001e0f,
		distortionScale: 50.0
	});

	rollingGroundSphere = new THREE.Mesh( sphereGeometry, water.material );
	rollingGroundSphere.add(water);
	rollingGroundSphere.rotation.x = - Math.PI * 0.5;
	rollingGroundSphere.receiveShadow = true;
	rollingGroundSphere.castShadow=false;
	rollingGroundSphere.rotation.z=-Math.PI/2;
	scene.add( rollingGroundSphere );
	rollingGroundSphere.position.y=-24;
	rollingGroundSphere.position.z=2;
	addWorldTrees();
}
function addLight(){
	light = new THREE.HemisphereLight(0xfffafa,0x000000, .4)
	scene.add(light);
	sun = new THREE.DirectionalLight( 0xffffff, 3);
	sun.position.set(-600, 300, 600);
	sun.castShadow = true;
	scene.add(sun);
	//Set up shadow properties for the sun light
	sun.shadow.mapSize.width = 256;
	sun.shadow.mapSize.height = 256;
	sun.shadow.camera.near = 0.5;
	sun.shadow.camera.far = 50 ;
}


function addWorldTrees(){
	var numTrees=36;
	var gap=6.28/36;
	for(var i=0;i<numTrees;i++){
		addTree(false,i*gap, true);
		addTree(false,i*gap, false);
	}
}

function addTree(inPath, row, isLeft){
	var newTree;
	if(inPath){ //피해야하는 장애물
		if(treesPool.length==0)return;
		newTree=treesPool.pop();
		newTree.visible=true;
		//console.log("add tree");
		treesInPath.push(newTree);
		sphericalHelper.set( worldRadius-0.3, pathAngleValues[row], -rollingGroundSphere.rotation.x+4 );
	}else{ //안피해도 되는 사이드 장애물
		newTree=createTree();
		var forestAreaAngle=0;//[1.52,1.57,1.62];
		if(isLeft){
			forestAreaAngle=1.68+Math.random()*0.1;
		}else{
			forestAreaAngle=1.46-Math.random()*0.1;
		}
		sphericalHelper.set( worldRadius-0.3, forestAreaAngle, row );
	}
	newTree.position.setFromSpherical( sphericalHelper );
	var rollingGroundVector=rollingGroundSphere.position.clone().normalize();
	var treeVector=newTree.position.clone().normalize();
	newTree.quaternion.setFromUnitVectors(treeVector,rollingGroundVector);
	newTree.rotation.x+=(Math.random()*(2*Math.PI/10))+-Math.PI/10;
	
	rollingGroundSphere.add(newTree);
}
function createTree(){
	var sides=8;
	var tiers=6;
	var scalarMultiplier=(Math.random()*(0.25-0.1))+0.05;
	var treeGeometry = new THREE.ConeGeometry( 0.5, 1, sides, tiers);
	var treeMaterial = new THREE.MeshStandardMaterial( { color: 0x33ff33,shading:THREE.FlatShading  } );
	midPointVector=treeGeometry.vertices[0].clone();
	blowUpTree(treeGeometry.vertices,sides,0,scalarMultiplier);
	tightenTree(treeGeometry.vertices,sides,1);
	blowUpTree(treeGeometry.vertices,sides,2,scalarMultiplier*1.1,true);
	tightenTree(treeGeometry.vertices,sides,3);
	blowUpTree(treeGeometry.vertices,sides,4,scalarMultiplier*1.2);
	tightenTree(treeGeometry.vertices,sides,5);
	var treeTop = new THREE.Mesh( treeGeometry, treeMaterial );
	treeTop.castShadow=true;
	treeTop.receiveShadow=false;
	treeTop.position.y=0.9;
	treeTop.rotation.y=(Math.random()*(Math.PI));
	var treeTrunkGeometry = new THREE.CylinderGeometry( 0.1, 0.1,0.5);
	var trunkMaterial = new THREE.MeshStandardMaterial( { color: 0x886633,shading:THREE.FlatShading  } );
	var treeTrunk = new THREE.Mesh( treeTrunkGeometry, trunkMaterial );
	treeTrunk.position.y=0.25;
	var tree =new THREE.Object3D();
	tree.add(treeTrunk);
	tree.add(treeTop);
	return tree;
}
function blowUpTree(vertices,sides,currentTier,scalarMultiplier,odd){
	var vertexIndex;
	var vertexVector= new THREE.Vector3();
	var midPointVector=vertices[0].clone();
	var offset;
	for(var i=0;i<sides;i++){
		vertexIndex=(currentTier*sides)+1;
		vertexVector=vertices[i+vertexIndex].clone();
		midPointVector.y=vertexVector.y;
		offset=vertexVector.sub(midPointVector);
		if(odd){
			if(i%2===0){
				offset.normalize().multiplyScalar(scalarMultiplier/6);
				vertices[i+vertexIndex].add(offset);
			}else{
				offset.normalize().multiplyScalar(scalarMultiplier);
				vertices[i+vertexIndex].add(offset);
				vertices[i+vertexIndex].y=vertices[i+vertexIndex+sides].y+0.05;
			}
		}else{
			if(i%2!==0){
				offset.normalize().multiplyScalar(scalarMultiplier/6);
				vertices[i+vertexIndex].add(offset);
			}else{
				offset.normalize().multiplyScalar(scalarMultiplier);
				vertices[i+vertexIndex].add(offset);
				vertices[i+vertexIndex].y=vertices[i+vertexIndex+sides].y+0.05;
			}
		}
	}
}
function tightenTree(vertices,sides,currentTier){
	var vertexIndex;
	var vertexVector= new THREE.Vector3();
	var midPointVector=vertices[0].clone();
	var offset;
	for(var i=0;i<sides;i++){
		vertexIndex=(currentTier*sides)+1;
		vertexVector=vertices[i+vertexIndex].clone();
		midPointVector.y=vertexVector.y;
		offset=vertexVector.sub(midPointVector);
		offset.normalize().multiplyScalar(0.06);
		vertices[i+vertexIndex].sub(offset);
	}
}

function update(){
    rollingGroundSphere.rotation.x += rollingSpeed;
    if(heroSphere.position.y<=heroBaseY){
    	jumping=false;
    	bounceValue=(Math.random()*0.04)+0.005;
    }
    heroSphere.position.y+=bounceValue;
    heroSphere.position.x=THREE.Math.lerp(heroSphere.position.x,currentLane, 2*clock.getDelta());
    bounceValue-=gravity;
	if(levelClock.getElapsedTime() > 10) {
		levelClock.start();
		console.log("level up")
		treeReleaseInterval -= 0.03;
		rollingSpeed += 0.0006
		console.log(treeReleaseInterval);
		console.log(rollingSpeed);
	}
    if(clock.getElapsedTime()>treeReleaseInterval){
    	clock.start();
		var options=[0,1,2];
		var lane= Math.floor(Math.random()*3);
		addTree(true,lane);
		options.splice(lane,1);
		if(Math.random()>0.5){
			lane= Math.floor(Math.random()*2);
			addTree(true,options[lane]);
		}

    	if(!hasCollided){
			score+=2*treeReleaseInterval;
			scoreText.innerHTML=score.toString();
		}
    }
	water.material.uniforms.time.value += 1.0 / 100.0;
    doTreeLogic();
    doExplosionLogic();
    render();
	requestAnimationFrame(update);//request next update
}
function doTreeLogic(){
	var oneTree;
	var treePos = new THREE.Vector3();
	var treesToRemove=[];
	treesInPath.forEach( function ( element, index ) {
		oneTree=treesInPath[ index ];
		treePos.setFromMatrixPosition( oneTree.matrixWorld );
		if(treePos.z>6 &&oneTree.visible){//gone out of our view zone
			treesToRemove.push(oneTree);
		}else{//check collision
			if(treePos.distanceTo(heroSphere.position)<=0.6){ //장애물 부딪히는 감도
				console.log("hit");
				hasCollided=true;
				explode();
			}
		}
	});
	var fromWhere;
	treesToRemove.forEach( function ( element, index ) {
		oneTree=treesToRemove[ index ];
		fromWhere=treesInPath.indexOf(oneTree);
		treesInPath.splice(fromWhere,1);
		treesPool.push(oneTree);
		oneTree.visible=false;
		console.log("remove tree");
	});
}
function doExplosionLogic(){
	if(!particles.visible)return;
	for (var i = 0; i < particleCount; i ++ ) {
		particleGeometry.vertices[i].multiplyScalar(explosionPower);
	}
	if(explosionPower>1.005){
		explosionPower-=0.001;
	}else{
		particles.visible=false;
	}
	particleGeometry.verticesNeedUpdate = true;
}
function explode(){
	particles.position.y=2;
	particles.position.z=4.8;
	particles.position.x=heroSphere.position.x;
	for (var i = 0; i < particleCount; i ++ ) {
		var vertex = new THREE.Vector3();
		vertex.x = -0.2+Math.random() * 0.4;
		vertex.y = -0.2+Math.random() * 0.4 ;
		vertex.z = -0.2+Math.random() * 0.4;
		particleGeometry.vertices[i]=vertex;
	}
	explosionPower=1.07;
	particles.visible=true;
}
function render(){
	water.render();
    renderer.render(scene, camera);//draw
}
function gameOver () {
  //cancelAnimationFrame( globalRenderID );
  //window.clearInterval( powerupSpawnIntervalID );
}
function onWindowResize() {
	//resize & align
	sceneHeight = window.innerHeight;
	sceneWidth = window.innerWidth;
	renderer.setSize(sceneWidth, sceneHeight);
	camera.aspect = sceneWidth/sceneHeight;
	camera.updateProjectionMatrix();
}