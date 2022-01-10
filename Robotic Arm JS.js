"use strict";

var canvas;
var gl;

var theta=0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var modelViewMatrix1;
var modelViewMatrix2;
var modelViewMatrix3;
var modelViewMatrix4;
var modelViewMatrix5;

var numPositions  = 36;

var positions = [];
var colors = [];

var Arm1Rotate = [0.0,0.0,0.0];
var Arm1Translate = [0.0,0.0,0.0];
var Arm1Scale = [.1, 1.0 , .1];

var Arm2Rotate = [0.0,0.0,0.0];
var Arm2Translate = [.25, .5, 0.0];
var Arm2Scale = [0.5, 0.1 , 0.1];

var Arm3Rotate = [0.0,0.0,0.0];
var Arm3Translate = [0.5,0.25,0.0];
var Arm3Scale = [0.1, 0.5 , 0.1];

var CubeRotate = [0.0,0.0,0.0];
var CubeTranslate = [0.5,-.25,0.0];
var CubeScale = [0.2, 0.2 , 0.2];

var point = [];
var pickup = false;
var animate = false;

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);
var radius = 1.0;
var theta  = 1.57;
var phi    = 0.0;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );


    //
    //  Configure WebGL
    //
    colorCube();
    createAxis();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 1.0, .7);

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    // Load the color data into the GPU

    var cbufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cbufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

   // Load the vertex data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    
     // Load a default orthographic project matrix
    
     projectionMatrix = ortho(-2,2,-2,2,-2,2);
     projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
     gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));  
     

     // Constructand load a model view matrix by concatenating trasnformations
  
     modelViewMatrix = scale(1, 1, 1);
    
     modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
     gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

     //event listeners for buttons

     document.getElementById( "A1RY+" ).onclick = function () {Arm1RotateY(10)};
     document.getElementById( "A1RY-" ).onclick = function () {Arm1RotateY(-10)};
     document.getElementById( "A1EY+" ).onclick = function () {Arm1ScaleY(.01)};
     document.getElementById( "A1EY-" ).onclick = function () {Arm1ScaleY(-.01)};
     document.getElementById( "A2EY+" ).onclick = function () {Arm2ScaleX(.01)};
     document.getElementById( "A2EY-" ).onclick = function () {Arm2ScaleX(-.01)};
     document.getElementById( "A3EY+" ).onclick = function () {Arm3ScaleY(.01)};
     document.getElementById( "A3EY-" ).onclick = function () {Arm3ScaleY(-.01)};
     document.getElementById( "PickUp" ).onclick = function () {PickUpCheck()};
     document.getElementById( "PutDown" ).onclick = function () {pickup = false};
     document.getElementById( "CR" ).onclick = function () {theta += .2};
     document.getElementById( "CL" ).onclick = function () {theta += -.2};
     document.getElementById( "TA" ).onclick = function () {if(animate) animate = false; else animate = true};
     document.getElementById("Rotate").onchange = function(event) {cubeSliderX(event.target.value)};
    render();
}

function colorCube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d)
{
    var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(0.5,  0.5,  0.5, 1.0),
        vec4(0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(0.5,  0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(0.1, 0.1, 0.1, 1.0),  // red
        vec4(0.2, 0.2, 0.2, 1.0),  // yellow
        vec4(0.3, 0.3, 0.3, 1.0),  // green
        vec4(0.5, 0.5, 0.5, 1.0),  // blue
        vec4(0.5, 0.5, 0.5, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0)   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [a, b, c, a, c, d];

    for ( var i = 0; i < indices.length; ++i ) {
        positions.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);
    }
}

function createAxis()
{
    var o = [0.0,0.0,0.0,1.0];
    var x = [0.5,0.0,0.0,1.0];
    var y = [0.0,1.0,0.0,1.0];
    var z = [0.0,0.0,0.5,1.0];
    positions.push(o);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0))
    positions.push(x);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0))
    positions.push(o);
    colors.push(vec4(0.0, 1.0, 0.0, 1.0))
    positions.push(y);
    colors.push(vec4(0.0, 1.0, 0.0, 1.0))
    positions.push(o);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0))
    positions.push(z);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0))
}

function render() {

    UpdateArmRotations();
    UpdateArmTranslations();
    gl.viewport(0,0,canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear( gl.DEPTH_BUFFER_BIT);

    
    if(animate) theta += 0.01
    eye = vec3(radius*Math.cos(theta), 1, radius*Math.sin(theta));

    modelViewMatrix = lookAt(eye, at , up);
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINES, numPositions, 6);

    modelViewMatrix1 = mult( modelViewMatrix, rotateX(Arm1Rotate[0]));      
    modelViewMatrix1 = mult( modelViewMatrix1, rotateY(Arm1Rotate[1]));      
    modelViewMatrix1 = mult( modelViewMatrix1, rotateZ(Arm1Rotate[2]));       
    modelViewMatrix1 = mult( modelViewMatrix1, translate(Arm1Translate[0], Arm1Translate[1], Arm1Translate[2]) ); 
    modelViewMatrix1 = mult( modelViewMatrix1, scale(Arm1Scale[0], Arm1Scale[1], Arm1Scale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix1));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    
    modelViewMatrix2 = mult( modelViewMatrix, rotateX(Arm2Rotate[0]) );     
    modelViewMatrix2 = mult( modelViewMatrix2, rotateY(Arm2Rotate[1]) );       
    modelViewMatrix2 = mult( modelViewMatrix2, rotateZ(Arm2Rotate[2]) );       
    modelViewMatrix2 = mult( modelViewMatrix2, translate(Arm2Translate[0], Arm2Translate[1], Arm2Translate[2]) ); 
    modelViewMatrix2 = mult( modelViewMatrix2, scale(Arm2Scale[0], Arm2Scale[1], Arm2Scale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix2));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    

    modelViewMatrix3 = mult( modelViewMatrix, rotateX(Arm3Rotate[0]) );     
    modelViewMatrix3 = mult( modelViewMatrix3, rotateY(Arm3Rotate[1]) );       
    modelViewMatrix3 = mult( modelViewMatrix3, rotateZ(Arm3Rotate[2]) );       
    modelViewMatrix3 = mult( modelViewMatrix3, translate(Arm3Translate[0], Arm3Translate[1], Arm3Translate[2]) ); 
    modelViewMatrix3 = mult( modelViewMatrix3, scale(Arm3Scale[0], Arm3Scale[1], Arm3Scale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix3));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    modelViewMatrix4 = mult( modelViewMatrix, rotateX(CubeRotate[0]) );     
    modelViewMatrix4 = mult( modelViewMatrix4, rotateY(CubeRotate[1]) );       
    modelViewMatrix4 = mult( modelViewMatrix4, rotateZ(CubeRotate[2]) );       
    modelViewMatrix4 = mult( modelViewMatrix4, translate(CubeTranslate[0], CubeTranslate[1], CubeTranslate[2]) ); 
    modelViewMatrix4 = mult( modelViewMatrix4, scale(CubeScale[0], CubeScale[1], CubeScale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix4));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    //View Window
    gl.viewport(0, 0, canvas.width/2, canvas.height/2);
	gl.clear(gl.DEPTH_BUFFER_BIT);
    modelViewMatrix = mult(translate(0,0,0), rotateX(90));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINES, numPositions, 6);

    modelViewMatrix1 = mult( modelViewMatrix, rotateX(Arm1Rotate[0]));      
    modelViewMatrix1 = mult( modelViewMatrix1, rotateY(Arm1Rotate[1]));      
    modelViewMatrix1 = mult( modelViewMatrix1, rotateZ(Arm1Rotate[2]));       
    modelViewMatrix1 = mult( modelViewMatrix1, translate(Arm1Translate[0], Arm1Translate[1], Arm1Translate[2]) ); 
    modelViewMatrix1 = mult( modelViewMatrix1, scale(Arm1Scale[0], Arm1Scale[1], Arm1Scale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix1));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    
    modelViewMatrix2 = mult( modelViewMatrix, rotateX(Arm2Rotate[0]) );     
    modelViewMatrix2 = mult( modelViewMatrix2, rotateY(Arm2Rotate[1]) );       
    modelViewMatrix2 = mult( modelViewMatrix2, rotateZ(Arm2Rotate[2]) );       
    modelViewMatrix2 = mult( modelViewMatrix2, translate(Arm2Translate[0], Arm2Translate[1], Arm2Translate[2]) ); 
    modelViewMatrix2 = mult( modelViewMatrix2, scale(Arm2Scale[0], Arm2Scale[1], Arm2Scale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix2));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    

    modelViewMatrix3 = mult( modelViewMatrix, rotateX(Arm3Rotate[0]) );     
    modelViewMatrix3 = mult( modelViewMatrix3, rotateY(Arm3Rotate[1]) );       
    modelViewMatrix3 = mult( modelViewMatrix3, rotateZ(Arm3Rotate[2]) );       
    modelViewMatrix3 = mult( modelViewMatrix3, translate(Arm3Translate[0], Arm3Translate[1], Arm3Translate[2]) ); 
    modelViewMatrix3 = mult( modelViewMatrix3, scale(Arm3Scale[0], Arm3Scale[1], Arm3Scale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix3));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    modelViewMatrix4 = mult( modelViewMatrix, rotateX(CubeRotate[0]) );     
    modelViewMatrix4 = mult( modelViewMatrix4, rotateY(CubeRotate[1]) );       
    modelViewMatrix4 = mult( modelViewMatrix4, rotateZ(CubeRotate[2]) );       
    modelViewMatrix4 = mult( modelViewMatrix4, translate(CubeTranslate[0], CubeTranslate[1], CubeTranslate[2]) ); 
    modelViewMatrix4 = mult( modelViewMatrix4, scale(CubeScale[0], CubeScale[1], CubeScale[2]) );    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix4));
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    requestAnimationFrame(render);
}

function UpdateArmRotations()
{
    var PI = 3.1415926;
    var sectorStep = 2 * PI / 36;
    Arm2Rotate[1] = Arm1Rotate[1];
    Arm3Rotate[1] = Arm1Rotate[1];
    if(pickup)
    {
        CubeRotate[1] = Arm1Rotate[1];
    }
}

function UpdateArmTranslations()
{
    Arm2Translate[1] = (Arm1Scale[1]/2 + Arm1Translate[1]);
    Arm3Translate[1] = (Arm2Translate[1] - Arm3Scale[1]/2);
    Arm3Translate[0] = (Arm2Scale[0]/2 + Arm2Translate[0]);
    if(pickup)
    {
        CubeTranslate[0] = Arm2Scale[0];
        CubeTranslate[1] = Arm3Translate[1] - Arm3Scale[1]/2;
    }
}

function UpdatePoint()
{
    var PI = 3.1415926;
    var sectorStep = 2 * PI / 360;
    point[0] = Arm2Scale[0]*Math.cos(Arm1Rotate[1]*sectorStep);
    point[1] = Arm3Translate[1] - Arm3Scale[1]/2;
    point[2] = -Arm2Scale[0]*Math.sin(Arm1Rotate[1]*sectorStep);
}

function PickUpCheck()
{
    let cx = CubeTranslate[0];
    let cy = CubeTranslate[1];
    let cz = CubeTranslate[2];
    let cx2 = CubeTranslate[0];
    let cy2 = CubeTranslate[1];
    let cz2 = CubeTranslate[2];
    let cx3 = CubeTranslate[0];
    let cx4 = CubeTranslate[0];
    let cz3 = CubeTranslate[2];

    UpdatePoint();
    if((point[0] >= (+cx-0.1))&&(point[0] <= (+cx2+0.1))&&(point[1] >= (+cy-0.1))&&(point[1] <= (+cy2+0.1))&&(point[2] >= (+cz-0.1))&&(point[2] <= (+cz2+0.1)))
        pickup = true;
    else
        pickup = false;
    console.log("Cube" + CubeTranslate);
    console.log("Point" + point);
    console.log("X" + (+cx3 - 0.1) + " <= " + point[0] + " <= " + (+cx4 + 0.1))
    console.log("Pickup " + pickup);
}
function Arm1RotateY(rot)
{
    Arm1Rotate[1] += rot;
}

function cubeSliderX(x)
{
    if(pickup == false)
    {
        CubeTranslate[0] = x;
    }
}

function Arm1RotateYSlider(rot)
{
    Arm1Rotate[1] = rot;
}

function Arm1ScaleY(scale)
{
    Arm1Scale[1] += scale;
    Arm1Translate[1] += scale/2;
    //Arm2Translate[1] = Arm1Scale[1]/2 - scale;
}

function Arm2RotateZ(rot)
{
    Arm2Rotate[2] += rot;
}

function Arm2ScaleX(scale)
{
    Arm2Scale[0] += scale;
    Arm2Translate[0] += scale/2;
    //Arm2Translate[1] = Arm1Scale[1]/2 - scale;
}

function Arm3ScaleY(scale)
{
    Arm3Scale[1] += scale;
}

function Print()
{
    console.log("Grabber(XYZ): " + point);
}