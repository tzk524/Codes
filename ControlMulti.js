//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda AND
// Chapter 2: ColoredPoints.js (c) 2012 matsuda
//
// merged and modified to became:
//
// ControlMulti.js for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

//		--converted from 2D to 4D (x,y,z,w) vertices
//		--demonstrate how to keep & use MULTIPLE colored shapes 
//			in just one Vertex Buffer Object(VBO).
//		--demonstrate several different user I/O methods: 
//				--Webpage pushbuttons 
//				--Webpage edit-box text, and 'innerHTML' for text display
//				--Mouse click & drag within our WebGL-hosting 'canvas'
//				--Keyboard input: alphanumeric + 'special' keys (arrows, etc)
//
// Vertex shader program----------------------------------
var VSHADER_SOURCE =
	'uniform mat4 u_ModelMatrix;\n' +
	'attribute vec4 a_Position;\n' +
	'attribute vec4 a_Color;\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_Position = u_ModelMatrix * a_Position;\n' +
	'  gl_PointSize = 10.0;\n' +
	'  v_Color = a_Color;\n' +
	'}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE =
	//  '#ifdef GL_ES\n' +
	'precision mediump float;\n' +
	//  '#endif GL_ES\n' +
	'varying vec4 v_Color;\n' +
	'void main() {\n' +
	'  gl_FragColor = v_Color;\n' +
	'}\n';

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.
//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');
// our HTML-5 canvas object that uses 'gl' for drawing.

// ----------For tetrahedron & its matrix---------------------------------
var g_vertsMax = 0;                 // number of vertices held in the VBO 
// (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
// to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
// in milliseconds; used by 'animate()' fcn 
// (now called 'timerAll()' ) to find time
// elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 45.0;
var g_angle02Rate = 15.0;
var g_angle02max = 45.0;
var g_angle02min = 0.0;


// TES Global Constants
var g_tes01 = 0;
var g_tes01_rate = 15;
var g_tes02 = 0;
var g_tes02_rate = 0.5;
var g_tes02_max = 0.3;
var	g_tes02_min = -0.3;
var g_tes03 = 0;
var g_tes03_rate = 90;

// Sword Global Constants
var g_sword01 = 0;
var g_sword01_rate = 15;
var g_sword01_max = 45;
var g_sword01_min = 0;
var g_sword02 = 0;
var g_sword02_rate = 720;
var g_sword03 = 45;
var g_sword03_rate = 180;
var g_sword03_max = 90;
var g_sword03_min = 0;
//------------For mouse click-and-drag: -------------------------------
var g_isDrag = false;		// mouse-drag: true when user holds down mouse button
var g_xMclik = 0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik = 0.0;
var g_xMdragTot = 0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot = 0.0;

function main() {
	//==============================================================================
	/*REPLACED THIS: 
	// Retrieve <canvas> element:
	 var canvas = document.getElementById('webgl'); 
	//with global variable 'g_canvas' declared & set above.
	*/

	// Get gl, the rendering context for WebGL, from our 'g_canvas' object
	gl = getWebGLContext(g_canvas);
	if (!gl) {
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	// Initialize a Vertex Buffer in the graphics system to hold our vertices
	g_maxVerts = initVertexBuffer(gl);
	if (g_maxVerts < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
	// KEYBOARD:
	// The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
	//      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown);
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
	window.addEventListener("mousemove", myMouseMove);
	window.addEventListener("mouseup", myMouseUp);
	window.addEventListener("click", myMouseClick);
	window.addEventListener("dblclick", myMouseDblClick);
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
	//
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
	//     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------

	// Specify the color for clearing <canvas>
	gl.clearColor(0.3, 0.3, 0.3, 1.0);

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST);

	// Get handle to graphics system's storage location of u_ModelMatrix
	g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	if (!g_modelMatLoc) {
		console.log('Failed to get the storage location of u_ModelMatrix');
		return;
	}
	/* REPLACED by global var 'g_ModelMatrix' (declared, constructed at top)
	  // Create a local version of our model matrix in JavaScript 
	  var modelMatrix = new Matrix4();
	*/
	/* REPLACED by global g_angle01 variable (declared at top)
	  // Create, init current rotation angle value in JavaScript
	  var currentAngle = 0.0;
	*/

	// ANIMATION: create 'tick' variable whose value is this function:
	//----------------- 
	var tick = function () {
		//g_angle01 = animate(g_angle01);  // Update the rotation angle
		animate();
		drawAll();   // Draw all parts
		//    console.log('g_angle01=',g_angle01.toFixed(5)); // put text in console.

		//	Show some always-changing text in the webpage :  
		//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
		//			 	(a <div> element placed just after our WebGL 'canvas' element)
		// 				and replace it's internal HTML commands (if any) with some
		//				on-screen text that reports our current angle value:
		//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		document.getElementById('CurAngleDisplay').innerHTML =
			'g_angle01= ' + g_angle01.toFixed(5);
		// Also display our current mouse-dragging state:
		document.getElementById('Mouse').innerHTML =
			'Mouse Drag totals (CVV coords):\t' +
			g_xMdragTot.toFixed(5) + ', \t' + g_yMdragTot.toFixed(5);
		//--------------------------------
		requestAnimationFrame(tick, g_canvas);
		// Request that the browser re-draw the webpage
		// (causes webpage to endlessly re-draw itself)
	};
	tick();							// start (and continue) animation: draw current image

}

function initVertexBuffer() {
	var colorShapes = new Float32Array([
		// TES LOGO
		0.0, 0.4, 0.1, 1.0, 0.28, 0.64, 0.51,
		-0.4, 0.2, 0.1, 1.0, 0.7, 0.51, 0.95,
		0.4, 0.2, 0.1, 1.0, 0.11, 0.42, 0.03,
		-0.4, 0.2, 0.1, 1.0, 0.92, 0.52, 0.19,
		-0.2, 0.1, 0.1, 1.0, 0.58, 0.05, 0.56,
		0.2, 0.1, 0.1, 1.0, 0.57, 0.56, 0.4,
		-0.4, 0.2, 0.1, 1.0, 0.08, 0.77, 0.33,
		0.2, 0.1, 0.1, 1.0, 0.91, 0.63, 0.26,
		0.4, 0.2, 0.1, 1.0, 0.68, 0.77, 0.88,
		-0.4, 0.2, 0.1, 1.0, 0.31, 0.51, 0.46,
		-0.4, -0.2, 0.1, 1.0, 0.02, 0.14, 0.61,
		-0.2, 0.1, 0.1, 1.0, 0.39, 0.41, 0.05,
		0.2, 0.1, 0.1, 1.0, 0.27, 0.96, 0.97,
		0.4, -0.2, 0.1, 1.0, 0.92, 0.89, 0.36,
		0.4, 0.2, 0.1, 1.0, 0.21, 0.52, 0.85,
		-0.2, 0.1, 0.1, 1.0, 0.7, 0.9, 0.27,
		-0.4, -0.2, 0.1, 1.0, 0.29, 0.01, 0.22,
		-0.1, 0.0, 0.1, 1.0, 0.12, 0.09, 0.94,
		0.2, 0.1, 0.1, 1.0, 0.94, 0.68, 0.99,
		0.1, 0.0, 0.1, 1.0, 0.05, 0.83, 0.42,
		0.4, -0.2, 0.1, 1.0, 0.45, 0.45, 0.48,
		-0.4, -0.2, 0.1, 1.0, 0.66, 0.46, 0.65,
		-0.1, -0.6, 0.1, 1.0, 0.14, 0.65, 0.08,
		-0.1, 0.0, 0.1, 1.0, 0.7, 0.46, 0.83,
		0.1, 0.0, 0.1, 1.0, 0.34, 0.85, 0.94,
		0.1, -0.6, 0.1, 1.0, 0.11, 0.16, 0.59,
		0.4, -0.2, 0.1, 1.0, 0.36, 0.48, 0.57,
		-0.1, 0.0, 0.1, 1.0, 0.31, 0.06, 0.13,
		-0.1, -0.3, 0.1, 1.0, 0.75, 0.79, 0.04,
		0.1, -0.3, 0.1, 1.0, 0.39, 0.54, 0.45,
		0.1, 0.0, 0.1, 1.0, 0.92, 0.12, 0.87,
		-0.1, 0.0, 0.1, 1.0, 0.11, 0.76, 0.23,
		0.1, -0.3, 0.1, 1.0, 0.59, 0.07, 0.79,
		0.0, 0.4, -0.1, 1.0, 0.02, 0.83, 0.62,
		-0.4, 0.2, -0.1, 1.0, 0.02, 0.51, 0.9,
		0.4, 0.2, -0.1, 1.0, 0.53, 0.59, 0.32,
		-0.4, 0.2, -0.1, 1.0, 0.9, 0.49, 0.81,
		-0.2, 0.1, -0.1, 1.0, 0.1, 0.84, 0.1,
		0.2, 0.1, -0.1, 1.0, 0.49, 0.32, 0.23,
		-0.4, 0.2, -0.1, 1.0, 0.88, 0.17, 0.41,
		0.2, 0.1, -0.1, 1.0, 0.78, 0.9, 0.36,
		0.4, 0.2, -0.1, 1.0, 0.36, 0.98, 0.46,
		-0.4, 0.2, -0.1, 1.0, 0.92, 0.32, 0.51,
		-0.4, -0.2, -0.1, 1.0, 0.46, 0.33, 0.8,
		-0.2, 0.1, -0.1, 1.0, 0.02, 0.58, 0.4,
		0.2, 0.1, -0.1, 1.0, 0.56, 0.34, 0.11,
		0.4, -0.2, -0.1, 1.0, 0.21, 0.49, 0.18,
		0.4, 0.2, -0.1, 1.0, 0.91, 0.26, 0.4,
		-0.2, 0.1, -0.1, 1.0, 0.98, 0.89, 0.55,
		-0.4, -0.2, -0.1, 1.0, 0.18, 0.88, 0.05,
		-0.1, 0.0, -0.1, 1.0, 0.95, 0.41, 0.8,
		0.2, 0.1, -0.1, 1.0, 0.71, 0.54, 0.65,
		0.1, 0.0, -0.1, 1.0, 0.38, 0.16, 0.92,
		0.4, -0.2, -0.1, 1.0, 0.86, 0.3, 0.71,
		-0.4, -0.2, -0.1, 1.0, 0.26, 0.82, 0.6,
		-0.1, -0.6, -0.1, 1.0, 0.69, 0.24, 0.57,
		-0.1, 0.0, -0.1, 1.0, 0.52, 0.5, 0.89,
		0.1, 0.0, -0.1, 1.0, 0.65, 0.18, 0.11,
		0.1, -0.6, -0.1, 1.0, 0.08, 0.43, 0.16,
		0.4, -0.2, -0.1, 1.0, 0.25, 0.5, 0.75,
		-0.1, 0.0, -0.1, 1.0, 0.41, 0.5, 0.51,
		-0.1, -0.3, -0.1, 1.0, 0.95, 0.16, 0.67,
		0.1, -0.3, -0.1, 1.0, 0.86, 0.5, 0.75,
		0.1, 0.0, -0.1, 1.0, 0.01, 0.98, 0.2,
		-0.1, 0.0, -0.1, 1.0, 0.08, 0.02, 0.12,
		0.1, -0.3, -0.1, 1.0, 0.22, 0.36, 0.51,
		0.0, 0.4, 0.1, 1.0, 0.82, 0.88, 0.83,
		0.0, 0.4, -0.1, 1.0, 0.64, 0.65, 0.33,
		-0.4, 0.2, 0.1, 1.0, 0.16, 0.26, 0.32,
		-0.4, 0.2, -0.1, 1.0, 0.5, 0.71, 0.53,
		-0.4, -0.2, 0.1, 1.0, 0.82, 0.39, 0.77,
		-0.4, -0.2, -0.1, 1.0, 0.5, 0.09, 0.23,
		-0.1, -0.6, 0.1, 1.0, 0.67, 0.41, 0.46,
		-0.1, -0.6, -0.1, 1.0, 0.98, 0.53, 0.73,
		-0.1, -0.3, 0.1, 1.0, 0.93, 0.08, 0.96,
		-0.1, -0.3, -0.1, 1.0, 0.3, 0.67, 0.87,
		0.1, -0.3, 0.1, 1.0, 0.16, 0.48, 0.69,
		0.1, -0.3, -0.1, 1.0, 0.57, 0.57, 0.65,
		0.1, -0.6, 0.1, 1.0, 0.09, 0.47, 0.99,
		0.1, -0.6, -0.1, 1.0, 0.17, 0.03, 0.24,
		0.4, -0.2, 0.1, 1.0, 0.73, 0.96, 0.91,
		0.4, -0.2, -0.1, 1.0, 0.39, 0.74, 0.42,
		0.4, 0.2, 0.1, 1.0, 0.19, 0.31, 0.16,
		0.4, 0.2, -0.1, 1.0, 0.99, 0.69, 0.0,
		0.0, 0.4, 0.1, 1.0, 0.92, 0.03, 0.76,
		0.0, 0.4, -0.1, 1.0, 0.95, 0.76, 0.14,
		-0.2, 0.1, 0.1, 1.0, 0.54, 0.08, 0.29,
		-0.2, 0.1, -0.1, 1.0, 0.07, 0.01, 0.02,
		-0.1, 0.0, 0.1, 1.0, 0.92, 0.53, 0.49,
		-0.1, 0.0, -0.1, 1.0, 0.54, 0.56, 0.88,
		0.1, 0.0, 0.1, 1.0, 1.0, 0.16, 0.34,
		0.1, 0.0, -0.1, 1.0, 0.29, 0.39, 0.4,
		0.2, 0.1, 0.1, 1.0, 0.55, 0.36, 0.52,
		0.2, 0.1, -0.1, 1.0, 0.33, 0.65, 0.97,
		-0.2, 0.1, 0.1, 1.0, 0.29, 0.17, 0.57,
		-0.2, 0.1, -0.1, 1.0, 0.15, 0.95, 0.98,

		// Sword
		0.0, 0.8, 0.1, 1.0, 0.48, 0.16, 0.32,
		-0.1, 0.6, 0.1, 1.0, 0.82, 0.89, 0.61,
		0.1, 0.6, 0.1, 1.0, 0.95, 0.12, 0.48,
		-0.1, 0.6, 0.1, 1.0, 0.28, 0.99, 0.71,
		-0.1, 0.0, 0.1, 1.0, 0.56, 0.48, 0.03,
		0.1, 0.6, 0.1, 1.0, 0.31, 0.93, 0.95,
		0.1, 0.6, 0.1, 1.0, 0.15, 0.1, 0.81,
		-0.1, 0.0, 0.1, 1.0, 0.69, 0.67, 0.22,
		0.1, 0.0, 0.1, 1.0, 0.34, 0.14, 0.39,
		0.0, 0.8, -0.1, 1.0, 0.46, 0.27, 0.86,
		-0.1, 0.6, -0.1, 1.0, 0.46, 0.23, 0.96,
		0.1, 0.6, -0.1, 1.0, 0.26, 0.04, 0.83,
		-0.1, 0.6, -0.1, 1.0, 0.31, 0.08, 0.05,
		-0.1, 0.0, -0.1, 1.0, 0.29, 0.87, 0.48,
		0.1, 0.6, -0.1, 1.0, 0.17, 0.12, 0.27,
		0.1, 0.6, -0.1, 1.0, 0.99, 0.16, 0.6,
		-0.1, 0.0, -0.1, 1.0, 0.86, 0.29, 0.68,
		0.1, 0.0, -0.1, 1.0, 0.76, 0.7, 0.69,
		-0.1, 0.0, 0.1, 1.0, 0.69, 0.67, 0.88,
		-0.3, -0.1, 0.1, 1.0, 0.88, 0.94, 0.62,
		0.0, -0.1, 0.1, 1.0, 0.4, 0.31, 0.45,
		0.1, 0.0, 0.1, 1.0, 0.93, 0.21, 0.55,
		0.0, -0.1, 0.1, 1.0, 0.14, 0.33, 0.18,
		0.3, -0.1, 0.1, 1.0, 0.27, 0.09, 0.61,
		0.1, 0.0, 0.1, 1.0, 0.68, 0.38, 0.46,
		-0.1, 0.0, 0.1, 1.0, 0.67, 0.53, 0.75,
		0.0, -0.1, 0.1, 1.0, 0.15, 0.87, 0.24,
		-0.1, 0.0, -0.1, 1.0, 0.56, 0.06, 0.49,
		-0.3, -0.1, -0.1, 1.0, 0.7, 0.06, 0.9,
		0.0, -0.1, -0.1, 1.0, 0.1, 0.82, 0.06,
		0.1, 0.0, -0.1, 1.0, 0.72, 0.01, 0.49,
		0.0, -0.1, -0.1, 1.0, 0.9, 0.97, 0.71,
		0.3, -0.1, -0.1, 1.0, 0.54, 0.46, 0.86,
		0.1, 0.0, -0.1, 1.0, 0.49, 0.22, 0.12,
		-0.1, 0.0, -0.1, 1.0, 0.6, 0.31, 0.8,
		0.0, -0.1, -0.1, 1.0, 0.04, 0.43, 0.7,
		-0.05, -0.1, 0.1, 1.0, 0.95, 0.45, 0.5,
		-0.05, -0.4, 0.1, 1.0, 0.65, 0.68, 0.74,
		0.05, -0.1, 0.1, 1.0, 0.96, 0.72, 0.45,
		0.05, -0.1, 0.1, 1.0, 0.09, 0.24, 0.42,
		-0.05, -0.4, 0.1, 1.0, 0.16, 0.61, 0.18,
		0.05, -0.4, 0.1, 1.0, 0.65, 0.56, 0.41,
		-0.05, -0.1, -0.1, 1.0, 0.83, 0.62, 0.53,
		-0.05, -0.4, -0.1, 1.0, 0.34, 0.04, 0.02,
		0.05, -0.1, -0.1, 1.0, 0.37, 0.47, 0.56,
		0.05, -0.1, -0.1, 1.0, 0.52, 0.56, 0.88,
		-0.05, -0.4, -0.1, 1.0, 0.68, 0.37, 0.17,
		0.05, -0.4, -0.1, 1.0, 0.83, 0.8, 0.09,
		0.0, 0.8, 0.1, 1.0, 0.68, 0.46, 0.03,
		0.0, 0.8, -0.1, 1.0, 0.1, 0.44, 0.42,
		-0.1, 0.6, 0.1, 1.0, 0.51, 0.37, 0.66,
		-0.1, 0.6, -0.1, 1.0, 0.52, 0.85, 0.59,
		-0.1, 0.0, 0.1, 1.0, 0.45, 0.79, 0.1,
		-0.1, 0.0, -0.1, 1.0, 0.19, 0.06, 0.85,
		-0.3, -0.1, 0.1, 1.0, 0.59, 0.75, 0.69,
		-0.3, -0.1, -0.1, 1.0, 0.51, 0.29, 0.8,
		-0.05, -0.1, 0.1, 1.0, 0.4, 0.16, 0.56,
		-0.05, -0.1, -0.1, 1.0, 0.97, 0.63, 0.52,
		-0.05, -0.4, 0.1, 1.0, 1.0, 0.36, 0.38,
		-0.05, -0.4, -0.1, 1.0, 0.59, 0.27, 0.78,
		0.05, -0.4, 0.1, 1.0, 0.97, 0.57, 0.85,
		0.05, -0.4, -0.1, 1.0, 0.71, 0.78, 0.44,
		0.05, -0.1, 0.1, 1.0, 0.09, 0.43, 0.98,
		0.05, -0.1, -0.1, 1.0, 0.03, 0.45, 0.91,
		0.3, -0.1, 0.1, 1.0, 0.47, 0.96, 0.99,
		0.3, -0.1, -0.1, 1.0, 0.96, 0.49, 0.78,
		0.1, 0.0, 0.1, 1.0, 0.97, 0.31, 0.99,
		0.1, 0.0, -0.1, 1.0, 0.76, 0.92, 0.35,
		0.1, 0.6, 0.1, 1.0, 0.84, 0.88, 0.32,
		0.1, 0.6, -0.1, 1.0, 0.88, 0.79, 0.18,
		0.0, 0.8, 0.1, 1.0, 0.92, 0.95, 0.06,
		0.0, 0.8, -0.1, 1.0, 0.51, 0.69, 0.36,
	]);
	var length_tes = 96;
	var length_sword = 72;
	g_vertsMax = length_tes + length_sword;		// 12 tetrahedron vertices.
	// we can also draw any subset of these we wish,
	// such as the last 3 vertices.(onscreen at upper right)

	// Create a buffer object
	var shapeBufferHandle = gl.createBuffer();
	if (!shapeBufferHandle) {
		console.log('Failed to create the shape buffer object');
		return false;
	}

	// Bind the the buffer object to target:
	gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
	// Transfer data from Javascript array colorShapes to Graphics system VBO
	// (Use sparingly--may be slow if you transfer large shapes stored in files)
	gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

	var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

	//Get graphics system's handle for our Vertex Shader's position-input variable: 
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if (a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	// Use handle to specify how to retrieve position data from our VBO:
	gl.vertexAttribPointer(
		a_Position, 	// choose Vertex Shader attribute to fill with data
		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
		false, 				// did we supply fixed-point data AND it needs normalizing?
		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
		// (x,y,z,w, r,g,b) * bytes/value
		0);						// Offset -- now many bytes from START of buffer to the
	// value we will actually use?
	gl.enableVertexAttribArray(a_Position);
	// Enable assignment of vertex buffer object's position data

	// Get graphics system's handle for our Vertex Shader's color-input variable;
	var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
	if (a_Color < 0) {
		console.log('Failed to get the storage location of a_Color');
		return -1;
	}
	// Use handle to specify how to retrieve color data from our VBO:
	gl.vertexAttribPointer(
		a_Color, 				// choose Vertex Shader attribute to fill with data
		3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
		gl.FLOAT, 			// data type for each value: usually gl.FLOAT
		false, 					// did we supply fixed-point data AND it needs normalizing?
		FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
		// (x,y,z,w, r,g,b) * bytes/value
		FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
	// value we will actually use?  Need to skip over x,y,z,w

	gl.enableVertexAttribArray(a_Color);
	// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
	// Unbind the buffer object 
	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	/* REMOVED -- global 'g_vertsMax' means we don't need it anymore
	  return nn;
	*/
}

function drawAll_TES() {
	// Center Face
	g_modelMatrix.setTranslate(0.0, 0.5, 0.0);
	g_modelMatrix.rotate(g_tes01, 0, 1, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawTES();

	// Left Face
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(-0.75, g_tes02, 0.0);
		g_modelMatrix.scale(0.5, 0.5, 0.5);
  		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		DrawTES();
		
		// Front Face
		pushMatrix(g_modelMatrix);
			g_modelMatrix.translate(0.0, 0.0, 0.5);
			g_modelMatrix.scale(0.5, 0.5, 0.5);
			g_modelMatrix.rotate(g_tes03, 0, 0, 1);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			DrawTES();
		g_modelMatrix = popMatrix();

		// Back Face
		pushMatrix(g_modelMatrix);
			g_modelMatrix.translate(0.0, 0.0, -0.5);
			g_modelMatrix.scale(0.5, 0.5, 0.5);
			g_modelMatrix.rotate(g_tes03, 0, 0, 1);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			DrawTES();
		g_modelMatrix = popMatrix();

	g_modelMatrix = popMatrix();
	  
	// Right Face
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(0.75, g_tes02, 0.0);
		g_modelMatrix.scale(0.5, 0.5, 0.5);
  		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		DrawTES();
		  
		// Front Face
		pushMatrix(g_modelMatrix);
			g_modelMatrix.translate(0.0, 0.0, 0.5);
			g_modelMatrix.scale(0.5, 0.5, 0.5);
			g_modelMatrix.rotate(g_tes03, 0, 0, 1);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			DrawTES();
		g_modelMatrix = popMatrix();

		// Back Face
		pushMatrix(g_modelMatrix);
			g_modelMatrix.translate(0.0, 0.0, -0.5);
			g_modelMatrix.scale(0.5, 0.5, 0.5);
			g_modelMatrix.rotate(g_tes03, 0, 0, 1);
			gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
			DrawTES();
		g_modelMatrix = popMatrix();
	g_modelMatrix = popMatrix();
}

function drawAll_sword() {
	g_modelMatrix.setTranslate(-0.6, -0.7, 0.0);
	g_modelMatrix.rotate(-g_sword01, 0, 0, 1);
	g_modelMatrix.rotate(-10*g_sword01, 1, 1, 0);
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawSword();

	g_modelMatrix.translate(0.6, 0.8, 0.0);
	g_modelMatrix.scale(0.7, 0.7, 0.7)
	g_modelMatrix.rotate(90, 0, 0, 1);
	g_modelMatrix.rotate(g_sword02, 0, 1, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawSword();


	g_modelMatrix.translate(0, -0.6, 0);
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	g_modelMatrix.rotate(180, 1, 0, 0);
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(-0.1, -0.1, 0);
		g_modelMatrix.rotate(g_sword03, 0, 0, 1);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		DrawSword();
	g_modelMatrix = popMatrix();

	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(0.1, -0.1, 0);
		g_modelMatrix.rotate(-g_sword03, 0, 0, 1);
		gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
		DrawSword();
	g_modelMatrix = popMatrix();
}

function drawAll() {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	g_modelMatrix.scale(1, 1, -1);
	drawAll_TES();
	drawAll_sword();
}

function DrawTES() {
	gl.drawArrays(gl.TRIANGLES, 0, 66);
	gl.drawArrays(gl.TRIANGLE_STRIP, 66, 20);
	gl.drawArrays(gl.TRIANGLE_STRIP, 86, 10);
}

function DrawSword() {
	gl.drawArrays(gl.TRIANGLES, 96, 48);
	gl.drawArrays(gl.TRIANGLE_STRIP, 144, 24);
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

/*
function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -85 degrees:
//  if(angle >  120.0 && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
//  if(angle <  -85.0 && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;
  
  var newAngle = angle + (g_angle01Rate * elapsed) / 1000.0;
  if(newAngle > 180.0) newAngle = newAngle - 360.0;
  if(newAngle <-180.0) newAngle = newAngle + 360.0;
  return newAngle;
}
*/

function animate() {
	var now = Date.now();
	var elapsed = now - g_last;
	g_last = now;
	animate_TES(elapsed);
	animate_sword(elapsed);
}

function animate_TES(elapsed) {
	var newAngle = g_tes01 + (g_tes01_rate * elapsed) / 1000.0;
	if(newAngle > 180.0) newAngle = newAngle - 360.0;
	if(newAngle <-180.0) newAngle = newAngle + 360.0;
	g_tes01 = newAngle;

	if (g_tes02 > g_tes02_max && g_tes02_rate > 0) {g_tes02_rate = -g_tes02_rate;}
	if (g_tes02 < g_tes02_min && g_tes02_rate < 0) {g_tes02_rate = -g_tes02_rate;}
	g_tes02 = g_tes02 + (g_tes02_rate * elapsed) / 1000.0;

	var newAngle = g_tes03 + (g_tes03_rate * elapsed) / 1000.0;
	if(newAngle > 180.0) newAngle = newAngle - 360.0;
	if(newAngle <-180.0) newAngle = newAngle + 360.0;
	g_tes03 = newAngle;
}

function animate_sword(elapsed) {
	if (g_sword01 > g_sword01_max && g_sword01_rate > 0) {g_sword01_rate = -g_sword01_rate;}
	if (g_sword01 < g_sword01_min && g_sword01_rate < 0) {g_sword01_rate = -g_sword01_rate;}
	g_sword01 = g_sword01 + (g_sword01_rate * elapsed) / 1000.0;

	var newAngle = g_sword02 + (g_sword02_rate * elapsed) / 1000.0;
	if(newAngle > 180.0) newAngle = newAngle - 360.0;
	if(newAngle <-180.0) newAngle = newAngle + 360.0;
	g_sword02 = newAngle;

	if (g_sword03 > g_sword03_max && g_sword03_rate > 0) {g_sword03_rate = -g_sword03_rate;}
	if (g_sword03 < g_sword03_min && g_sword03_rate < 0) {g_sword03_rate = -g_sword03_rate;}
	g_sword03 = g_sword03 + (g_sword03_rate * elapsed) / 1000.0;
	
}

//==================HTML Button Callbacks======================

function angleSubmit() {
	// Called when user presses 'Submit' button on our webpage
	//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
	//	the HTML 'input' element with id='usrAngle'.  Within that
	//	element you'll find a 'button' element that calls this fcn.

	// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;
	// Display what we read from the edit-box: use it to fill up
	// the HTML 'div' element with id='editBoxOut':
	document.getElementById('EditBoxOut').innerHTML = 'You Typed: ' + UsrTxt;
	console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
	g_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};

function clearDrag() {
	// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}

function spinUp() {
	// Called when user presses the 'Spin >>' button on our webpage.
	// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
	// the HTML 'button' element with onclick='spinUp()'.
	g_angle01Rate += 25;
}

function spinDown() {
	// Called when user presses the 'Spin <<' button
	g_angle01Rate -= 25;
}

function runStop() {
	// Called when user presses the 'Run/Stop' button
	if (g_angle01Rate * g_angle01Rate > 1) {  // if nonzero rate,
		myTmp = g_angle01Rate;  // store the current rate,
		g_angle01Rate = 0;      // and set to zero.
	}
	else {    // but if rate is zero,
		g_angle01Rate = myTmp;  // use the stored rate.
	}
}

//===================Mouse and Keyboard event-handling Callbacks

function myMouseDown(ev) {
	//==============================================================================
	// Called when user PRESSES down any mouse button;
	// 									(Which button?    console.log('ev.button='+ev.button);   )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);

	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - g_canvas.width / 2) / 		// move origin to center of canvas and
		(g_canvas.width / 2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height / 2) /		//										 -1 <= y < +1.
		(g_canvas.height / 2);
	//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);

	g_isDrag = true;											// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
	document.getElementById('MouseAtResult').innerHTML =
		'Mouse At: ' + x.toFixed(5) + ', ' + y.toFixed(5);
};


function myMouseMove(ev) {
	//==============================================================================
	// Called when user MOVES the mouse with a button already pressed down.
	// 									(Which button?   console.log('ev.button='+ev.button);    )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if (g_isDrag == false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);

	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - g_canvas.width / 2) / 		// move origin to center of canvas and
		(g_canvas.width / 2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height / 2) /		//										 -1 <= y < +1.
		(g_canvas.height / 2);
	//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);					// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
	document.getElementById('MouseAtResult').innerHTML =
		'Mouse At: ' + x.toFixed(5) + ', ' + y.toFixed(5);
	document.getElementById('MouseDragResult').innerHTML =
		'Mouse Drag: ' + (x - g_xMclik).toFixed(5) + ', ' + (y - g_yMclik).toFixed(5);

	g_xMclik = x;													// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
	//==============================================================================
	// Called when user RELEASES mouse button pressed previously.
	// 									(Which button?   console.log('ev.button='+ev.button);    )
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
	//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);

	// Convert to Canonical View Volume (CVV) coordinates too:
	var x = (xp - g_canvas.width / 2) / 		// move origin to center of canvas and
		(g_canvas.width / 2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height / 2) /		//										 -1 <= y < +1.
		(g_canvas.height / 2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t', x, ',\t', y);

	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position:
	document.getElementById('MouseAtResult').innerHTML =
		'Mouse At: ' + x.toFixed(5) + ', ' + y.toFixed(5);
	console.log('myMouseUp: g_xMdragTot,g_yMdragTot =', g_xMdragTot, ',\t', g_yMdragTot);
};

function myMouseClick(ev) {
	//=============================================================================
	// Called when user completes a mouse-button single-click event 
	// (e.g. mouse-button pressed down, then released)
	// 									   
	//    WHICH button? try:  console.log('ev.button='+ev.button); 
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
	//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

	// STUB
	console.log("myMouseClick() on button: ", ev.button);
}

function myMouseDblClick(ev) {
	//=============================================================================
	// Called when user completes a mouse-button double-click event 
	// 									   
	//    WHICH button? try:  console.log('ev.button='+ev.button); 
	// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
	//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
	//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

	// STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button);
}

function myKeyDown(kev) {
	//===============================================================================
	// Called when user presses down ANY key on the keyboard;
	//
	// For a light, easy explanation of keyboard events in JavaScript,
	// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
	// For a thorough explanation of a mess of JavaScript keyboard event handling,
	// see:    http://javascript.info/tutorial/keyboard-events
	//
	// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
	//        'keydown' event deprecated several read-only properties I used
	//        previously, including kev.charCode, kev.keyCode. 
	//        Revised 2/2019:  use kev.key and kev.code instead.
	//
	// Report EVERYTHING in console:
	console.log("--kev.code:", kev.code, "\t\t--kev.key:", kev.key,
		"\n--kev.ctrlKey:", kev.ctrlKey, "\t--kev.shiftKey:", kev.shiftKey,
		"\n--kev.altKey:", kev.altKey, "\t--kev.metaKey:", kev.metaKey);

	// and report EVERYTHING on webpage:
	document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
	document.getElementById('KeyModResult').innerHTML = '';
	// key details:
	document.getElementById('KeyModResult').innerHTML =
		"   --kev.code:" + kev.code + "      --kev.key:" + kev.key +
		"<br>--kev.ctrlKey:" + kev.ctrlKey + " --kev.shiftKey:" + kev.shiftKey +
		"<br>--kev.altKey:" + kev.altKey + "  --kev.metaKey:" + kev.metaKey;

	switch (kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if (g_isRun == true) {
				g_isRun = false;    // STOP animation
			}
			else {
				g_isRun = true;     // RESTART animation
				tick();
			}
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			console.log("a/A key: Strafe LEFT!\n");
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown() found a/A key. Strafe LEFT!';
			break;
		case "KeyD":
			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown() found d/D key. Strafe RIGHT!';
			break;
		case "KeyS":
			console.log("s/S key: Move BACK!\n");
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown() found s/Sa key. Move BACK.';
			break;
		case "KeyW":
			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown() found w/W key. Move FWD!';
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft":
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown(): Left Arrow=' + kev.keyCode;
			break;
		case "ArrowRight":
			console.log('right-arrow.');
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown():Right Arrow:keyCode=' + kev.keyCode;
			break;
		case "ArrowUp":
			console.log('   up-arrow.');
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown():   Up Arrow:keyCode=' + kev.keyCode;
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown(): Down Arrow:keyCode=' + kev.keyCode;
			break;
		default:
			console.log("UNUSED!");
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown(): UNUSED!';
			break;
	}
}

function myKeyUp(kev) {
	//===============================================================================
	// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode=' + kev.keyCode + ' released.');
}
