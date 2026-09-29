/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0;
const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0;
const WIN_TOP = 1;  // default top and bottom y coords in world space

const INPUT_TRIANGLES_URL =
    "https://raw.githubusercontent.com/NCSUCGClassPrivate/exercise5/async/triangles.json";

const INPUT_ELLIPSOIDS_URL =
    "https://raw.githubusercontent.com/NCSUCGClassPrivate/exercise5/async/ellipsoids.json";

var Eye = new vec4.fromValues(0.5, 0.5, -0.5, 1.0); // default eye position in world space

/* input globals */
var inputTriangles;
var numTriangleSets = 0;
var triSetSizes = [];

/* webgl globals */
var gl = null;
var vertexBuffers = [];
var triangleBuffers = [];
var vertexPositionAttrib;
var modelMatrixULoc;


// ASSIGNMENT HELPER FUNCTIONS

// get the JSON file from the passed URL
function getJSONFile(url, descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest();
            httpReq.open("GET", url, false);
            httpReq.send(null);

            var startTime = Date.now();

            while ((httpReq.status !== 200) &&
                   (httpReq.readyState !== XMLHttpRequest.DONE)) {

                if ((Date.now() - startTime) > 3000)
                    break;
            }

            if ((httpReq.status !== 200) ||
                (httpReq.readyState !== XMLHttpRequest.DONE))

                throw "Unable to open " + descr + " file!";

            else
                return JSON.parse(httpReq.response);
        }
    }

    catch(e) {
        console.log(e);
        return(String.null);
    }
}


// set up the webGL environment
function setupWebGL() {

    var canvas =
        document.getElementById("myWebGLCanvas");

    gl =
        canvas.getContext("webgl");

    try {

        if (gl == null) {

            throw "unable to create gl context -- is your browser gl ready?";

        } else {

            gl.clearColor(
                0.0,
                0.0,
                0.0,
                1.0
            );

            gl.clearDepth(1.0);

            gl.enable(
                gl.DEPTH_TEST
            );
        }
    }

    catch(e) {
        console.log(e);
    }
}


// read triangles in, load them into webgl buffers
function loadTriangles() {

    inputTriangles =
        getJSONFile(
            INPUT_TRIANGLES_URL,
            "triangles"
        );

    if (inputTriangles != String.null) {

        var whichSetVert;
        var whichSetTri;

        var vtxToAdd;
        var triToAdd;

        numTriangleSets =
            inputTriangles.length;


        for (
            var whichSet = 0;
            whichSet < numTriangleSets;
            whichSet++
        ) {

            inputTriangles[whichSet].coordArray = [];


            for (
                whichSetVert = 0;
                whichSetVert <
                    inputTriangles[whichSet].vertices.length;
                whichSetVert++
            ) {

                vtxToAdd =
                    inputTriangles[whichSet]
                    .vertices[whichSetVert];

                inputTriangles[whichSet]
                    .coordArray
                    .push(
                        vtxToAdd[0],
                        vtxToAdd[1],
                        vtxToAdd[2]
                    );
            }


            vertexBuffers[whichSet] =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ARRAY_BUFFER,
                vertexBuffers[whichSet]
            );

            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(
                    inputTriangles[whichSet]
                    .coordArray
                ),
                gl.STATIC_DRAW
            );


            inputTriangles[whichSet]
                .indexArray = [];

            triSetSizes[whichSet] =
                inputTriangles[whichSet]
                .triangles.length;


            for (
                whichSetTri = 0;
                whichSetTri <
                    triSetSizes[whichSet];
                whichSetTri++
            ) {

                triToAdd =
                    inputTriangles[whichSet]
                    .triangles[whichSetTri];

                inputTriangles[whichSet]
                    .indexArray
                    .push(
                        triToAdd[0],
                        triToAdd[1],
                        triToAdd[2]
                    );
            }


            triangleBuffers[whichSet] =
                gl.createBuffer();

            gl.bindBuffer(
                gl.ELEMENT_ARRAY_BUFFER,
                triangleBuffers[whichSet]
            );

            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(
                    inputTriangles[whichSet]
                    .indexArray
                ),
                gl.STATIC_DRAW
            );
        }
    }
}


// setup the webGL shaders
function setupShaders() {

    var fShaderCode = `

        void main(void) {

            gl_FragColor =
                vec4(
                    1.0,
                    1.0,
                    1.0,
                    1.0
                );
        }

    `;


    var vShaderCode = `

        attribute vec3 vertexPosition;

        uniform mat4 uModelMatrix;

        void main(void) {

            gl_Position =
                uModelMatrix *
                vec4(
                    vertexPosition,
                    1.0
                );
        }

    `;


    try {

        var fShader =
            gl.createShader(
                gl.FRAGMENT_SHADER
            );

        gl.shaderSource(
            fShader,
            fShaderCode
        );

        gl.compileShader(
            fShader
        );


        var vShader =
            gl.createShader(
                gl.VERTEX_SHADER
            );

        gl.shaderSource(
            vShader,
            vShaderCode
        );

        gl.compileShader(
            vShader
        );


        if (
            !gl.getShaderParameter(
                fShader,
                gl.COMPILE_STATUS
            )
        ) {

            throw "error during fragment shader compile: " +
                gl.getShaderInfoLog(fShader);

        }

        else if (
            !gl.getShaderParameter(
                vShader,
                gl.COMPILE_STATUS
            )
        ) {

            throw "error during vertex shader compile: " +
                gl.getShaderInfoLog(vShader);

        }

        else {

            var shaderProgram =
                gl.createProgram();

            gl.attachShader(
                shaderProgram,
                fShader
            );

            gl.attachShader(
                shaderProgram,
                vShader
            );

            gl.linkProgram(
                shaderProgram
            );


            if (
                !gl.getProgramParameter(
                    shaderProgram,
                    gl.LINK_STATUS
                )
            ) {

                throw "error during shader program linking: " +
                    gl.getProgramInfoLog(
                        shaderProgram
                    );

            }

            else {

                gl.useProgram(
                    shaderProgram
                );

                vertexPositionAttrib =
                    gl.getAttribLocation(
                        shaderProgram,
                        "vertexPosition"
                    );

                modelMatrixULoc =
                    gl.getUniformLocation(
                        shaderProgram,
                        "uModelMatrix"
                    );

                gl.enableVertexAttribArray(
                    vertexPositionAttrib
                );
            }
        }
    }

    catch(e) {
        console.log(e);
    }
}


// render the loaded model
function renderTriangles() {

    gl.clear(
        gl.COLOR_BUFFER_BIT |
        gl.DEPTH_BUFFER_BIT
    );


    /*
     * TRIANGLE SET 0
     *
     * Rotate the triangle and move it
     * into the lower-left portion
     * of the canvas.
     */

    inputTriangles[0].mMatrix =
        mat4.create();

    var triangleCenter =
        vec3.fromValues(
            0.25,
            0.75,
            0
        );


    // move center of triangle to origin
    mat4.fromTranslation(
        inputTriangles[0].mMatrix,
        vec3.negate(
            vec3.create(),
            triangleCenter
        )
    );


    // rotate triangle 90 degrees
    mat4.multiply(
        inputTriangles[0].mMatrix,

        mat4.fromRotation(
            mat4.create(),
            Math.PI / 2,
            vec3.fromValues(
                0,
                0,
                1
            )
        ),

        inputTriangles[0].mMatrix
    );


    // move triangle to target location
    mat4.multiply(
        inputTriangles[0].mMatrix,

        mat4.fromTranslation(
            mat4.create(),
            vec3.fromValues(
                -0.55,
                -0.30,
                0
            )
        ),

        inputTriangles[0].mMatrix
    );



    /*
     * TRIANGLE SET 1
     *
     * Scale the square,
     * rotate it 45 degrees,
     * and move it into the
     * lower-middle portion.
     */

    inputTriangles[1].mMatrix =
        mat4.create();


    var squareCenter =
        vec3.fromValues(
            0.75,
            0.25,
            0
        );


    // move square center to origin
    mat4.fromTranslation(
        inputTriangles[1].mMatrix,

        vec3.negate(
            vec3.create(),
            squareCenter
        )
    );


    // scale square larger
    mat4.multiply(
        inputTriangles[1].mMatrix,

        mat4.fromScaling(
            mat4.create(),
            vec3.fromValues(
                1.35,
                1.35,
                1
            )
        ),

        inputTriangles[1].mMatrix
    );


    // rotate square 45 degrees
    mat4.multiply(
        inputTriangles[1].mMatrix,

        mat4.fromRotation(
            mat4.create(),
            Math.PI / 4,
            vec3.fromValues(
                0,
                0,
                1
            )
        ),

        inputTriangles[1].mMatrix
    );


    // move square to target location
    mat4.multiply(
        inputTriangles[1].mMatrix,

        mat4.fromTranslation(
            mat4.create(),
            vec3.fromValues(
                -0.15,
                -0.45,
                0
            )
        ),

        inputTriangles[1].mMatrix
    );



    // draw both triangle sets
    for (
        var whichTriSet = 0;
        whichTriSet < numTriangleSets;
        whichTriSet++
    ) {

        gl.uniformMatrix4fv(
            modelMatrixULoc,
            false,
            inputTriangles[whichTriSet]
                .mMatrix
        );


        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            vertexBuffers[whichTriSet]
        );

        gl.vertexAttribPointer(
            vertexPositionAttrib,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );


        gl.bindBuffer(
            gl.ELEMENT_ARRAY_BUFFER,
            triangleBuffers[whichTriSet]
        );

        gl.drawElements(
            gl.TRIANGLES,
            3 *
                triSetSizes[whichTriSet],
            gl.UNSIGNED_SHORT,
            0
        );
    }
}



/* MAIN -- HERE is where execution begins after window load */

function main() {

    setupWebGL();

    loadTriangles();

    setupShaders();

    renderTriangles();
}
