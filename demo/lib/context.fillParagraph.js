// DRAW A PARAGRAPH
CanvasRenderingContext2D.prototype.fillParagraph = function(text,fontSize,font,x,y,width){
  this.font = fontSize+'px '+font;
  var words = text.split(' ');
  var lines = [];
  var i;
  lines.push(words.shift());
  while(words.length > 0){
    var word = words.shift();
    i = lines.length-1;
    var newline = lines[i]+' '+word;
    if(this.measureText(newline).width < width){
      lines[i] = newline;
    }else{
      lines.push(word);
    }
  }

  var leading = 1.2*fontSize;

  for(i=0;i<lines.length;i++){
    this.fillText(lines[i], x, y+leading*i);
  }

  return(leading*i); // height

};