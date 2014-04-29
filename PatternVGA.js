	
//
// imagePatternVGA
// canvasPatternVGA
// -----------
// Map 8-bit color bitmap to patterns in a 2x2 grid
//

/*
 *	[ 0-7 ] [ 0-7 ]
 *	[ 0-7 ] [ 0-7 ]
 *
 *	[ b b b ] [ b b b ] [ b b b ] [ b b b ] >> 3 = [ b b b ] [ b b b ] [ b b b ] >> 3 ...
 *									^ ^ ^ test these 3 bits for R,G,B
 *	R = 1 0 0 = 4
 *	G = 0 1 0 = 2
 *	B = 0 0 1 = 1
 *
 */

 // USAGE 
 //
 // ctx.drawImage( imagePatternVGA(44,2) );
 // ctx.fillStyle = canvasPatternVGA(444,2);
 //
 // var image = new Image(); 
 // img.src = imagePatternVGA.toDataURL('image/png');
 //

(function(window){

window.imagePatternVGA = function imagePatternVGA(bitmap,scale){

	scale = (scale > 0)?scale:1; // minimum scale:1x1

	var pattern_id = bitmap;

	var patternData = createImageData(2,2);

	var p = {r:255,g:255,b:255,a:255}; // could define custom red,green,blue values to change palette

	var bit_red = 1 << 2;
	var bit_green =  1 << 1;
	var bit_blue = 1 << 0;

	for(var i=0;i<patternData.data.length;i+=4){

		var n = i/4;
		var redBit = 4 << n;

		if(bitmap & bit_red) patternData.data[i] = p.r;
		if(bitmap & bit_green) patternData.data[i+1] = p.g;
		if(bitmap & bit_blue) patternData.data[i+2] = p.b;
		patternData.data[i+3] = p.a;

		bitmap = bitmap >> 3;
	}

	patternData = scaleImageData(patternData,scale);
	
	var imagePattern = imageDataToCanvas(patternData);

	return imagePattern;
};

window.canvasPatternVGA = function canvasPatternVGA(bitmap,scale){

	var imagePattern = imagePatternVGA(bitmap,scale);
	var ctx = imagePattern.getContext('2d');
	var pattern = ctx.createPattern(imagePattern,'repeat');

	return pattern;
};

//
// Helper functions
//

tmpCanvas = document.createElement('canvas');
tmpCtx = tmpCanvas.getContext('2d');

var createImageData = function(w, h) {
	return tmpCtx.createImageData(w, h);
};

var imageDataToCanvas = function(imageData) {
    var canvas = newCanvas(imageData.width, imageData.height);
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas;
};

var newCanvas = function(w,h) {
	var c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	return c;
};

var scaleImageData = function(imageData,scale){

	scale = (scale>0)?scale:1;

	var output = createImageData(imageData.width*scale, imageData.height*scale);
	var w = imageData.width;
	var h = imageData.height;
	var dst = output.data;
	var d = imageData.data;

	for (var y=0; y<h; y++) {
		for (var x=0; x<w; x++) {

			var p = getPixel(imageData,x,y);

			var offsetX = x*scale;
			var offsetY = y*scale;
			for(var outY=0; outY<scale; outY++){
				for(var outX=0; outX<scale;outX++){

					setPixel(output,p,outX+offsetX,outY+offsetY);
				}
			}
			//setPixel(output,p,x*2,y*2);
			//setPixel(output,p,x*2+1,y*2);
			//setPixel(output,p,x*2,y*2+1);
			//setPixel(output,p,x*2+1,y*2+1);
		}
	}
	return output;
};

var getPixel = function(imageData,x,y){

	var w = imageData.width;
	var h = imageData.height;
	var off = (y*w+x)*4;
	var d = imageData.data;

	return { r: d[off], g: d[off+1], b: d[off+2], a: d[off+3] };
};

var setPixel = function(imageData,p,x,y){

	var w = imageData.width;
	var h = imageData.height;
	var off = (y*w+x)*4;
	var d = imageData.data;

	d[off] = p.r;
	d[off+1] = p.g;
	d[off+2] = p.b;
	d[off+3] = p.a;
};


})(window);