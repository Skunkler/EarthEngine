//script written by Warren Kunkler in support of the UHII project, this script is a draft and still needs more testing
//It is designed to produce a cloud score for Landsat OLI imagery and stack the bands with an NDVI product



var img2 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
.filter(ee.Filter.eq('WRS_PATH',39))
    .filter(ee.Filter.eq('WRS_ROW',35))
                  .filterDate('2017-05-01', '2017-05-31');


//need to determine coordinates for region of interest
var roi = ee.Geometry.Polygon();


Map.setCenter(-115.1398, 36.1699, 12);


var CloudScore = function(img){
  
	var cloud = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud');
	var cloudiness = cloud.reduceRegion({
	reducer: 'mean',
	geometry: geometry,
	scale: 30,
	});
	return img.set(cloudiness);

}



var getNDVI = function(img){
	var outImg = img.addBands(img.normalizedDifference(['B5', 'B4']).rename('B12'));
	
	return outImg.toFloat();
}





var imgList = img2.getInfo()["features"];


for(var i = 0; i < imgList.length;i++){
	var im = ee.Image(imgList[i]["id]);
	var NDVI_plus_Bands = getNDVI(im.select('B.+'));
	var cloudScore = CloudScore(NDVI_plus_Bands);
	Export.image.toDrive({
  		image: cloudScore,
  		description: 'image',
  		scale: 30,
  		fileFormat: 'GeoTiff'
	});
}





