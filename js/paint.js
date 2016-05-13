(function() {

	// Set default selected tool as pen
	var selectedTool = 'Pen';
	
	// Define shape style variable to store shape styles like stroke and fill in later stages
	var shape_style = '';

	//Define arrays to store undo and redo images
	var undoList = [];
	var redoList = [];

	//Get the canvas element from HTML file and get its context which will be used for drawing operations 
	var canvas = document.querySelector('#paint');
	var ctx = canvas.getContext('2d');
	
	//Set width and height for our canvas element from our stylesheet
	var sketch = document.querySelector('#sketch');
	var sketch_style = getComputedStyle(sketch);
	canvas.width = parseInt(sketch_style.getPropertyValue('width'));
	canvas.height = parseInt(sketch_style.getPropertyValue('height'));
	
	
	// Creating a tmp canvas to draw current sketch and this will be merged to our permannent canvas after the drawing is finished
	// This canvas is more like a rough drawing sheet 
	var tmp_canvas = document.createElement('canvas');
	var tmp_ctx = tmp_canvas.getContext('2d');
	tmp_canvas.id = 'tmp_canvas';
	tmp_canvas.width = canvas.width;
	tmp_canvas.height = canvas.height;
	sketch.appendChild(tmp_canvas);
	
	// Set default stroke style as blue for our canvas
	tmp_ctx.strokeStyle = '#0000FF';
	tmp_ctx.lineWidth = 2;

	//Define arrays to store current movement, starting click and previous movement of the pointer 
	var mouse = {x: 0, y: 0};
	var start_mouse = {x: 0, y: 0};
	var last_mouse = {x: 0, y: 0};

	//Mouse Capturing - Used to capture last mouse movement and current mouse movement
	tmp_canvas.addEventListener('mousemove', function(e) {

		//Used for freehand pen to get previous pointer positions
		last_mouse.x = mouse.x;
		last_mouse.y = mouse.y;
		
		//Store current mouse movements
		mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
		mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
	}, false);

	//Bind mousedown event to our canvas and run mousemove listener in callback 
	tmp_canvas.addEventListener('mousedown', function(e) {
		
		// After pressing run mousemove binder to draw our shap based on selected tool. Draw function in the callback selected the tool being called
		tmp_canvas.addEventListener('mousemove', draw, false);
		
		//Capture mouse movements when drawing
		mouse.x = typeof e.offsetX !== 'undefined' ? e.offsetX : e.layerX;
		mouse.y = typeof e.offsetY !== 'undefined' ? e.offsetY : e.layerY;
		
		//Used to store the starting click for shapes like rectangle,circle
		start_mouse.x = mouse.x;
		start_mouse.y = mouse.y;
		
		//Save current state of canvas in undolist to be retrived during undo operations
		saveRestorePoint();

	}, false);
	
	//Bind mouseup event functionality in the callback and unbind mousemove event on releasing mouse click
	document.addEventListener('mouseup', function() {
		
		//unbind mousemove event on releasing mouse click
		tmp_canvas.removeEventListener('mousemove', draw, false);
		
		// Writing down to real canvas now
		ctx.drawImage(tmp_canvas, 0, 0);
		
		// Clearing tmp canvas or rough drawing sheet
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);	
			
	}, false);


	//This is our main function which contains the algorithms of our tools, based upon the selected tool, this function returns the tool. Uses if else statement to select tools
	var draw = function() {
		
		// Get the selected style whether fill or stroke
		shape_style = jQuery('.shape_style input:checked').val();
		
		
		//Canvas uses the beginPath to start the drawing path and inbuilt functions like moveTo,lineTo to coordinate the line. Stroke draws the line after its coordinates are defined and closePath ends our started path so that the canvas doesn't conflict between previous and next drawn shapes
		
		if(selectedTool == 'Pen'){
			tmp_ctx.beginPath();
			tmp_ctx.moveTo(last_mouse.x, last_mouse.y);
			tmp_ctx.lineTo(mouse.x, mouse.y);
			tmp_ctx.stroke();
			tmp_ctx.closePath();
						
		}else if(selectedTool == 'Line'){
			// Tmp canvas is always cleared up before drawing.
			tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
			
			tmp_ctx.beginPath();
			tmp_ctx.moveTo(start_mouse.x, start_mouse.y);
			tmp_ctx.lineTo(mouse.x, mouse.y);
			tmp_ctx.stroke();
			tmp_ctx.closePath();
		}else if(selectedTool == 'Rect'){
			// Tmp canvas is always cleared up before drawing.
			tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

			var x = Math.min(mouse.x, start_mouse.x);
			var y = Math.min(mouse.y, start_mouse.y);
			var width = Math.abs(mouse.x - start_mouse.x);
			var height = Math.abs(mouse.y - start_mouse.y);
			
			if(shape_style == 'fill'){
				tmp_ctx.fillRect(x, y, width, height);
			}else if(shape_style == 'stroke'){
				tmp_ctx.strokeRect(x, y, width, height);
			}
				
		}else if(selectedTool == 'Square'){

			// Tmp canvas is always cleared up before drawing.
			tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

			var x = Math.min(mouse.x, start_mouse.x);
			var y = Math.min(mouse.y, start_mouse.y);
			var side = Math.max(
				Math.abs(mouse.x - start_mouse.x),
				Math.abs(mouse.y - start_mouse.y)
			);
			
			tmp_ctx.beginPath();
			
			if(shape_style == 'fill'){
				tmp_ctx.fillRect(x, y, side,side);
			}else if(shape_style == 'stroke'){
				tmp_ctx.strokeRect(x, y, side,side);
			}

			tmp_ctx.closePath();
		}else if(selectedTool == 'Circle'){
			// Tmp canvas is always cleared up before drawing.
			tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

			var x = (mouse.x + start_mouse.x) / 2;
			var y = (mouse.y + start_mouse.y) / 2;
			
			var radius = Math.max(
				Math.abs(mouse.x - start_mouse.x),
				Math.abs(mouse.y - start_mouse.y)
			) / 2;
			
			tmp_ctx.beginPath();
			tmp_ctx.arc(x, y, radius, 0, Math.PI*2, false);
			
			if(shape_style == 'fill'){
				tmp_ctx.fill();
			}else if(shape_style == 'stroke'){
				tmp_ctx.stroke();
			}		
			
			tmp_ctx.closePath();				
		}else if(selectedTool == 'Ellipse'){
			// Tmp canvas is always cleared up before drawing.
			tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);

			var x = Math.min(mouse.x, start_mouse.x);
			var y = Math.min(mouse.y, start_mouse.y);
			
			var w = Math.abs(mouse.x - start_mouse.x);
			var h = Math.abs(mouse.y - start_mouse.y);
			
			drawEllipse(tmp_ctx, x, y, w, h);				
		}
	};


	function drawEllipse(ctx, x, y, w, h) {
		var kappa = .5522848,
		ox = (w / 2) * kappa, // control point offset horizontal
		oy = (h / 2) * kappa, // control point offset vertical
		xe = x + w,           // x-end
		ye = y + h,           // y-end
		xm = x + w / 2,       // x-middle
		ym = y + h / 2;       // y-middle
		
		ctx.beginPath();
		ctx.moveTo(x, ym);
		ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
		ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
		ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
		ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
		ctx.closePath();
		if(shape_style == 'fill'){
			tmp_ctx.fill();
		}else if(shape_style == 'stroke'){
			tmp_ctx.stroke();
		}
	}	
	
	
	/*---------------------------  Undo and redo functionlity functions -----------------*/

	// The function which saves the restoration points
	function saveRestorePoint() {
		// Get the current canvas drawing as a base64 encoded value
		var imgSrc = canvas.toDataURL("image/png");
	
		// and store this value as a 'undoList', to which we can later revert
		undoList.push(imgSrc);

	}
	
	// Function to restore the canvas from a restoration point
	function undoDrawOnCanvas() {
		// If we have some restore values in our array undoList
		if (undoList.length > 0) {
			
			//Before restoring push our present state to redo array to restore in later stage
			redoList.push(canvas.toDataURL("image/png"));
			
			// Create a new Image object in canvas
			var undoImg = new Image();
			// When the image object is fully loaded in the memory...
			undoImg.onload = function() {

				// and draw the image (restore point) on the canvas. That would overwrite anything
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(undoImg, 0, 0);  
			}
			
			//After our image is loaded remove the last item of undolist item and project it to canvas as seen in next step			
			undoState = undoList.pop();
			undoImg.src = undoState;
		}
	}

	// Function to restore the canvas from a restoration point
	function redoDrawOnCanvas() {
		// If we have some restore values in our array redoList
		if (redoList.length > 0) {
			
			//Before restoring push our present state to undo array to restore in later stage
			undoList.push(canvas.toDataURL("image/png"));
			
			// Create a new Image object
			var redoImg = new Image();
			// When the image object is fully loaded in the memory...
			redoImg.onload = function() {
				// and draw the image (first item in redolist) on the canvas. That would overwrite anything
				ctx.drawImage(redoImg, 0, 0);  
			}
			
			//After our image is loaded remove the first item of redolist item and project it to canvas as seen in next step		
			redoState = redoList.pop();
			redoImg.src = redoState;

		}
	}

	//Bind click function to undo button and run undo function 
	jQuery('.undo').click(function(e) {
		undoDrawOnCanvas();
		e.preventDefault();
	});
	
	//Bind click function to undo button and run redo function 
	jQuery('.redo').click(function(e) {
		redoDrawOnCanvas();
		e.preventDefault();
	});

	  
	/*---------------------------  Addtional Functions to setup layout -----------------*/

	//Bind click event to tools for switching between tools
	jQuery('.tools a').click(function(e) {

		selectedTool = jQuery(this).attr('title');
		
		//Used to set a class "selected" to clicked tool. Class used to verfiy selected tool in drawing operations
		if(selectedTool != 'Undo' && selectedTool != 'Redo'){
			jQuery('.tools li').removeClass('selected');
			jQuery(this).parent().addClass('selected');
		}
		
		// Prevent default click functionality of link
		e.preventDefault();
	});

	
	// Function uses a plugin library Colorpicker to implement a colorpicker tool. The function below calls the tool and setups in our HTML	
	jQuery('#colorSelector').ColorPicker({
		color: '#0000FF',
		onShow: function (colpkr) {
			jQuery(colpkr).fadeIn(500);
			return false;
		},
		onHide: function (colpkr) {
			jQuery(colpkr).fadeOut(500);
			return false;
		},
		onChange: function (hsb, hex, rgb) {
			jQuery('#colorSelector div').css('backgroundColor', '#' + hex);
			tmp_ctx.strokeStyle = '#' + hex;
			tmp_ctx.fillStyle = '#' + hex;
		}
	});	


	//Function uses the built in library Jquery UI to implement a slider to change the strokes of line
	jQuery( "#slider-range-max" ).slider({
		range: "max",
		min: 1,
		max: 5,
		value: 2,
		slide: function( event, ui ) {
			jQuery( "#amount" ).val( ui.value );
			if(shape_style == 'stroke'){
				tmp_ctx.lineWidth = ui.value;
			}
		}
	});
	
	
	//Change and show stroke value in an input
	jQuery( "#amount" ).val( jQuery( "#slider-range-max" ).slider( "value" ));
	
}());


