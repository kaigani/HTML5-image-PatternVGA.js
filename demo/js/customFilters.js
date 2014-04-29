// Custom filters

// Filters{} must already be defined in filters.js

// HELPER
var Utils = {};

Utils.getPixel = function(pixels,x,y){

	var w = pixels.width;
	var h = pixels.height;
	var off = (y*w+x)*4;
	var d = pixels.data;

	return { r: d[off], g: d[off+1], b: d[off+2], a: d[off+3] };
};

Utils.setPixel = function(pixels,p,x,y){

	var w = pixels.width;
	var h = pixels.height;
	var off = (y*w+x)*4;
	var d = pixels.data;

	d[off] = p.r;
	d[off+1] = p.g;
	d[off+2] = p.b;
	d[off+3] = p.a;
};

// return as a string
Utils.pixelColor = function(p){

	return 'rgba('+Math.floor(p.r)+','+Math.floor(p.g)+','+Math.floor(p.b)+','+p.a/255+')';

};

Utils.averageRect = function(pixels,x0,y0,w,h){

	var avg = { r:0, g:0 , b:0, a:0 };
	var div = 0;

	for (var y=y0; y<y0+h; y++) {
		for (var x=x0; x<x0+w; x++) {

			var p = Utils.getPixel(pixels,x,y);
			
			avg.r += p.r;
			avg.g += p.g;
			avg.b += p.b;
			avg.a += p.a;

			div++;
		}
	}

	if(div > 0){
		avg.r /= div;
		avg.g /= div;
		avg.b /= div;
		avg.a /= div;
		//avg.a = 1;
	}

	return(avg);

};

// Imperfect averaging

Utils.averagePoly = function(pixels,poly,x,y){

	var avg = { r:0, g:0 , b:0, a:0 };
	var sum = 0;
	var w = pixels.width;
	var h = pixels.height;

	for (var i=0; i<poly.length; i++) {

		var o = { x: x+poly[i][0], y: y+poly[i][1] };

		if(o.x < w && o.y < h){

			var p = Utils.getPixel(pixels,o.x,o.y);
			
			avg.r += p.r;
			avg.g += p.g;
			avg.b += p.b;
			avg.a += p.a;

			sum++;
		}

		
	}

	if(sum > 0){
		avg.r /= sum;
		avg.g /= sum;
		avg.b /= sum;
		avg.a /= sum;
		//avg.a = 1;
	}

	return(avg);

};

Utils.getPolyMask = function(poly){

	var rect = Utils.getPolyRect(poly);

	var buffer = Filters.getCanvas(rect.w,rect.h);
	var c = buffer.getContext('2d');

	// draw a mask
	c.fillStyle = 'rgb(0,0,0)';
	// TODO --- need a translate to rect.x,rect.y!!

// ----

// *********************

// ----

	Utils.drawPoly(c,poly,0,0);

	// Get mask pixels
	var maskPixels = Filters.getPixels(buffer);
	
	return(maskPixels);
};

// True average from bounding rect. pass x0,y0 the upper left corner of bounding rect
Utils.averageFromMask = function(pixels,maskPixels,x0,y0) {

	var w = pixels.width;
	var h = pixels.height;

	var mask_w = maskPixels.width;
	var mask_h = maskPixels.height;

	var avg = { r:0, g:0 , b:0, a:0 };
	var count = 0;

	// Find average within masked area
	for(var y=0;y<mask_h;y++){
		for(var x=0;x<mask_w;x++){

			var mask_p = Utils.getPixel(maskPixels,x,y);
			var p = Utils.getPixel(pixels,x0+x,y0+y);

			if(mask_p.a > 0){

				avg.r += p.r;
				avg.g += p.g;
				avg.b += p.b;
				avg.a += p.a;

				count++;
			}
		}
	}

	if(count > 0){
		avg.r /= count;
		avg.g /= count;
		avg.b /= count;
		avg.a /= count;
	}

	return avg;
};

Utils.drawPoly = function(c,poly,x,y){

	// Draw poly
	c.beginPath();
	c.moveTo(x+poly[0][0],y+poly[0][1]);

	for(var i=1; i<poly.length;i++){
		c.lineTo(x+poly[i][0],y+poly[i][1]);
	}
	
	c.closePath();
	c.fill();
};

Utils.getPolyRect = function(poly){

	var left = poly[0][0];
	var top = poly[0][1];
	var w = 0;
	var h = 0;

	for(var i=0;i<poly.length;i++){

		var x = poly[i][0];
		var y = poly[i][1];

		left = (left < x)? left : x;
		top = (top < y)? top : y;
		w = (x > w)? x : w;
		h = (y > h)? y : h;
	}

	return( {x:left,y:top,w:w,h:h} );
};

//
// MY FILTERS
//

Filters.scale2x = function(pixels) {
	var output = Filters.createImageData(pixels.width*2, pixels.height*2);
	var w = pixels.width;
	var h = pixels.height;
	var dst = output.data;
	var d = pixels.data;

	for (var y=0; y<h; y++) {
		for (var x=0; x<w; x++) {

			var p = Utils.getPixel(pixels,x,y);
			Utils.setPixel(output,p,x*2,y*2);
			Utils.setPixel(output,p,x*2+1,y*2);
			Utils.setPixel(output,p,x*2,y*2+1);
			Utils.setPixel(output,p,x*2+1,y*2+1);

		}
	}
	return output;
};

Filters.average = function(pixels) {

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	var w = pixels.width;
	var h = pixels.height;
	//var dst = output.data;
	var d = pixels.data;

	var avg = Utils.averageRect(pixels,0,0,w,h);
	
	c.fillStyle = Utils.pixelColor(avg);
	c.fillRect(0, 0, canvas.width, canvas.height);

	var output= Filters.getPixels(canvas);
	return output;
};

Filters.squareCell = function(pixels, size) {

	size = size || model.cellSize;

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	// White
	c.fillStyle = 'rgb(255,255,255)';
	c.fillRect(0,0,canvas.width,canvas.height);

	var w = pixels.width;
	var h = pixels.height;
	//var dst = output.data;
	var d = pixels.data;

	for(var y=0;y<h;y+=size){
		for(var x=0;x<w;x+=size){
	
			var avg = Utils.averageRect(pixels,x,y,size,size);

			c.fillStyle = Utils.pixelColor(avg);
			//c.strokeStyle = "rgb(0,0,0)";
			c.fillRect(x, y, size, size);
			//c.strokeRect(x*10, y*10, 10, 10);
		}
	}
	
	var output= Filters.getPixels(canvas);
	return output;
};

Filters.rightTriangleCell = function(pixels, size) {

	size = size || model.cellSize;

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	var w = pixels.width;
	var h = pixels.height;
	//var dst = output.data;
	var d = pixels.data;

	var avg, poly;

	for(var y=0;y<h;y+=size){
		for(var x=0;x<w;x+=size){

			var row = Math.floor( y/size );
			var col = Math.floor( x/size );
			var cell = row*( Math.floor( h/size ) )+col;

			var isAltCell = false;

			if(row%2 === 0){
				isAltCell = (col%2 === 0);
			}else{
				isAltCell = (col%2 !== 0);
			}

			var bounds = [

				[0, 0] ,
				[size, 0] ,
				[size, size] ,
				[0, size] ,
			];

			// Draw a base rectangle - for colour behind
			avg = Utils.averagePoly(pixels,bounds,x,y);
			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,bounds,x,y);

			// Draw upper poly
			poly = (isAltCell) ? [ bounds[0], bounds[1], bounds[3] ] : [ bounds[0], bounds[1], bounds[2] ];
			avg = Utils.averagePoly(pixels,poly,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);
			
			// Draw lower poly
			poly = (isAltCell) ? [ bounds[1], bounds[2], bounds[3] ] : [ bounds[0], bounds[2], bounds[3] ];
			avg = Utils.averagePoly(pixels,poly,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);

		}
	}
	
	var output= Filters.getPixels(canvas);
	return output;
};

Filters.triangleCell = function(pixels, size) {

	size = size || model.cellSize;

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	var w = pixels.width;
	var h = pixels.height;
	//var dst = output.data;
	var d = pixels.data;

	var avg, poly;

	for(var y=0;y<h;y+=size){
		for(var x=0;x<w;x+=size){

			var row = Math.floor( y/size );
			var col = Math.floor( x/size );
			var cell = row*( Math.floor( h/size ) )+col;

			var isAltCell = false;

			if(row%2 === 0){
				isAltCell = (col%2 === 0);
			}else{
				isAltCell = (col%2 !== 0);
			}

			var bounds = [

				[0, 0] ,
				[size, 0] ,
				[size, size] ,
				[0, size] ,
			];

			// Draw a base rectangle - for colour behind
			avg = Utils.averagePoly(pixels,bounds,x,y);
			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,bounds,x,y);

			// Draw upper poly
			poly = (row%2) ? [ bounds[0], bounds[1], [ size/2, size ] ] : [ bounds[3], [ size/2, 0 ], bounds[2] ];
			avg = Utils.averagePoly(pixels,poly,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);
			
			// Draw lower poly
			poly = (row%2) ? [ [ 0-size/2, size ], bounds[0], [ size/2, size ] ] : [ [ 0-size/2, 0 ], bounds[3], [ size/2, 0 ] ];
			avg = Utils.averagePoly(pixels,poly,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);

		}
	}
	
	var output= Filters.getPixels(canvas);
	return output;
};

Filters.avgTriangleCell = function(pixels, size) {

	size = size || model.cellSize;

	pixels = Filters.squareCell(pixels, size);

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	var w = pixels.width;
	var h = pixels.height;

	var avg, poly;

	for(var y=0;y<h;y+=size){
		for(var x=0;x<w;x+=size){

			var row = Math.floor( y/size );
			var col = Math.floor( x/size );
			var cell = row*( Math.floor( h/size ) )+col;

			var isAltCell = false;

			if(row%2 === 0){
				isAltCell = (col%2 === 0);
			}else{
				isAltCell = (col%2 !== 0);
			}

			var bounds = [

				[0, 0] ,
				[size, 0] ,
				[size, size] ,
				[0, size] ,
			];

			// Draw a base rectangle - for colour behind
			avg = Utils.averagePoly(pixels,bounds,x,y);
			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,bounds,x,y);

			// Draw upper poly
			poly = (row%2) ? [ bounds[0], bounds[1], [ size/2, size ] ] : [ bounds[3], [ size/2, 0 ], bounds[2] ];
			avg = Utils.averagePoly(pixels,poly,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);
			
			// Draw lower poly
			poly = (row%2) ? [ [ 0-size/2, size ], bounds[0], [ size/2, size ] ] : [ [ 0-size/2, 0 ], bounds[3], [ size/2, 0 ] ];
			avg = Utils.averagePoly(pixels,poly,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);

		}
	}
	
	var output= Filters.getPixels(canvas);
	return output;
};

Filters.trueTriangleCell = function(pixels, size) {

	size = size || model.cellSize;

	//pixels = Filters.squareCell(pixels, size);

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	var w = pixels.width;
	var h = pixels.height;

	var avg, poly, mask;

	var bounds = [

		[0, 0] ,
		[size, 0] ,
		[size, size] ,
		[0, size] ,
	];

	var upperPolyA = [ bounds[0], bounds[1], [ size/2, size ] ];
	var upperPolyB = [ bounds[3], [ size/2, 0 ], bounds[2] ];

	var lowerPolyA = [ [ 0-size/2, size ], bounds[0], [ size/2, size ] ];
	var lowerPolyB = [ [ 0-size/2, 0 ], bounds[3], [ size/2, 0 ] ];

	var upperMaskA = Utils.getPolyMask(upperPolyA);
	var upperMaskB = Utils.getPolyMask(upperPolyB);
	var lowerMaskA = Utils.getPolyMask(lowerPolyA);
	var lowerMaskB = Utils.getPolyMask(lowerPolyB);

	for(var y=0;y<h;y+=size){
		for(var x=0;x<w;x+=size){

			var row = Math.floor( y/size );
			var col = Math.floor( x/size );
			var cell = row*( Math.floor( h/size ) )+col;

			var isAltCell = false;

			if(row%2 === 0){
				isAltCell = (col%2 === 0);
			}else{
				isAltCell = (col%2 !== 0);
			}

			// Draw a base rectangle - for colour behind
			avg = Utils.averageRect(pixels,x,y,size,size);
			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,bounds,x,y);

			// Draw upper poly
			poly = (row%2) ? upperPolyA : upperPolyB;
			mask = (row%2) ? upperMaskA : upperMaskB;
			avg = Utils.averageFromMask(pixels,mask,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);
			
			// Draw lower poly
			poly = (row%2) ? lowerPolyA : lowerPolyB;
			mask = (row%2) ? lowerMaskA : lowerMaskB;
			avg = Utils.averageFromMask(pixels,mask,x,y);

			c.fillStyle = Utils.pixelColor(avg);
			Utils.drawPoly(c,poly,x,y);
		}
	}
	
	var output= Filters.getPixels(canvas);
	return output;
};


Filters.maskPoly = function(pixels) {

	//var canvas = Filters.getCanvas(pixels.width, pixels.height);
	//var c = canvas.getContext('2d');

	var output = Filters.createImageData(pixels.width, pixels.height);
	//var output = Filters.grayscale(pixels);

	var w = pixels.width;
	var h = pixels.height;

	var avg, poly;

	poly = [
		[ 10,10 ],
		[ 230,50 ],
		[ 200,150 ],
		[ 60,160 ],
	];

	// Double buffer
	var rect = Utils.getPolyRect(poly);
	var buffer = Filters.getCanvas(w,h);
	c2 = buffer.getContext('2d');

	// draw a mask
	c2.fillStyle = 'rgb(0,0,0)';
	Utils.drawPoly(c2,poly,0,0);

	//c.strokeStyle = 'rgb(0,255,0)';
	//c.strokeRect(rect.x,rect.y,rect.w,rect.h);

	// Get mask pixels
	//var maskPixels = Filters.getPixels(buffer);
	var maskPixels = Utils.getPolyMask(poly);

	//c.drawImage(buffer,rect.x,rect.y,rect.w,rect.h);

	for(var y=0;y<rect.h;y++){
		for(var x=0;x<rect.w;x++){

			var mask_p = Utils.getPixel(maskPixels,rect.x+x,rect.y+y);
			var source_p = Utils.getPixel(pixels,rect.x+x,rect.y+y);

			if(mask_p.a > 0){

				source_p.a = mask_p.a;
				Utils.setPixel(output,source_p,rect.x+x,rect.y+y);
			}else{

				//source_p.r += 128;
				//source_p.r = (source_p.r < 255)?source_p.r:255;
				//Utils.setPixel(output,source_p,rect.x+x,rect.y+y);
			}

		}
	}
	
	return output;
};

Filters.averagePoly = function(pixels) {

	//var output = Filters.createImageData(pixels.width, pixels.height);

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	var w = pixels.width;
	var h = pixels.height;

	var avg = { r:0, g:0 , b:0, a:0 };
	var count = 0;

	var poly = [
		[ 10,10 ],
		[ 230,50 ],
		[ 200,150 ],
		[ 60,160 ],
	];

	// Double buffer
	var rect = Utils.getPolyRect(poly);
	var buffer = Filters.getCanvas(rect.w,rect.h);
	c2 = buffer.getContext('2d');

	// draw a mask
	c2.fillStyle = 'rgb(0,0,0)';
	Utils.drawPoly(c2,poly,0,0);

	// Get mask pixels
	var maskPixels = Filters.getPixels(buffer);

	maskPixels = Utils.getPolyMask(poly);

	//c.drawImage(buffer,rect.x,rect.y,rect.w,rect.h);

	for(var y=0;y<rect.h;y++){
		for(var x=0;x<rect.w;x++){

			var mask_p = Utils.getPixel(maskPixels,rect.x+x,rect.y+y);
			var p = Utils.getPixel(pixels,rect.x+x,rect.y+y);

			if(mask_p.a > 0){

				//source_p.a = mask_p.a;
				//Utils.setPixel(output,source_p,rect.x+x,rect.y+y);

				avg.r += p.r;
				avg.g += p.g;
				avg.b += p.b;
				avg.a += p.a;

				count++;
			}
		}
	}

	if(count > 0){
		avg.r /= count;
		avg.g /= count;
		avg.b /= count;
		avg.a /= count;
	}

	c.fillStyle = Utils.pixelColor(avg);
	Utils.drawPoly(c,poly,0,0);

	var output = Filters.getPixels(canvas);
	return output;
};

Filters.triangulate = function(pixels,count){

	count = count || model.cellSize;

	var canvas = Filters.getCanvas(pixels.width, pixels.height);
	var c = canvas.getContext('2d');

	var w = pixels.width;
	var h = pixels.height;

	var vertices = [];

	// Generate random points - [x,y]
	for(var i=0;i<count;i++){

		var rand_x = Math.floor( Math.random() * w );
		var rand_y = Math.floor( Math.random() * h );

		vertices.push( [rand_x,rand_y] );
	}
	// corners
	vertices.push( [0,0] );
	vertices.push( [w/2,0] );
	vertices.push( [w,0] );
	vertices.push( [w,h/2] );
	vertices.push( [w,h] );
	vertices.push( [w/2,h] );
	vertices.push( [0,h] );
	vertices.push( [0,h/2] );

	var triangles = Delaunay.triangulate(vertices);

	for(i = 0; i<triangles.length; i+=3){

		var triangle = [
			[ vertices[triangles[i]][0], vertices[triangles[i]][1] ] ,
			[ vertices[triangles[i+1]][0], vertices[triangles[i+1]][1] ] ,
			[ vertices[triangles[i+2]][0], vertices[triangles[i+2]][1] ] ,
		];

		var maskPixels = Utils.getPolyMask(triangle);
		var avg = Utils.averageFromMask(pixels,maskPixels,0,0);
		//var rect = Utils.getPolyRect(triangle);
		//var avg = Utils.averagePoly(pixels,triangle,rect.x,rect.y);

		c.fillStyle = Utils.pixelColor(avg);
		c.strokeStyle = Utils.pixelColor(avg);

        c.beginPath();
        //--i; c.moveTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
        //--i; c.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
        //--i; c.lineTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);

        //c.moveTo(vertices[triangles[i]][0], vertices[triangles[i]][1]);
        //c.lineTo(vertices[triangles[i+1]][0], vertices[triangles[i+1]][1]);
        //c.lineTo(vertices[triangles[i+2]][0], vertices[triangles[i+2]][1]);
       
        c.moveTo(triangle[0][0],triangle[0][1]);
        c.lineTo(triangle[1][0],triangle[1][1]);
        c.lineTo(triangle[2][0],triangle[2][1]);
        c.closePath();
        c.fill();
        c.stroke();
      }

	var output = Filters.getPixels(canvas);
	return output;
};