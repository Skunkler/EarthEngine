//This code was written by Warren Kunkler on 1/16/2020 in support of the Urban Heat Island project
//This script takes two different image collections, one of OLI data with TOA reflectance and one with at surface
//a region of interest polygon is used to query which images from the TOA reflectance are too cloudy for the analysis and uses the root name from
//the TOA collection to remove the specific landsat scene from the at surface reflectance collection before running ndvi on the at surface data



//our TOA and SR collections
var L8_TOA = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
.filter(ee.Filter.eq('WRS_PATH',39))
    .filter(ee.Filter.eq('WRS_ROW',35))
                  .filterDate('2017-05-01', '2017-10-31');


var L8_SR = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
.filter(ee.Filter.eq('WRS_PATH',39))
    .filter(ee.Filter.eq('WRS_ROW',35))
                  .filterDate('2017-05-01', '2017-10-31');

//region of interest, in this case covers all of Las Vegas, Boulder City, Henderson, North Las Vegas
var roi = ee.Geometry.Point([-115.1398, 36.1500]).buffer(40000);
Map.addLayer(roi,{color: '0000FF'});


Map.setCenter(-115.1398, 36.1500, 10);

//set a filter on the TOA collection our ROI
var c = L8_TOA.filterBounds(roi);

//this function is mapped to the entired of the TOA collection that is "clipped" to the ROI
//compures a simple cloud score and removes images that do not meet the threshhold for acceptable cloud cover
var CloudScore = c.map(function(img){
  
	var cloud = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud');
	var cloudiness = cloud.reduceRegion({
	reducer: 'mean',
	geometry: roi,
	scale: 30,
	});
	return img.set(cloudiness);

})


//filters out array of L8 TOA data with cloud filter function, stores variable in L8_TOA_out
var L8_TOA_out = CloudScore.filter(ee.Filter.lt('cloud',10));
var listIDVals = L8_TOA_out.getInfo()["features"];


//loops through object of filtered TOA data and adds just the root names of each landsat scene that passed the cloud filter
//stores root names in KeepList
var KeepList = [];

for(var i =0; i < listIDVals.length;i++){
  KeepList.push(listIDVals[i]["id"].toString().split('/')[4]);
}





//our simple stand alone NDVI calculation function






var imgList = L8_SR.getInfo()["features"];

//loops through our at surface collection, if the root name of the SR collection is in KeepList, we know it is a relatively clear image
//otherwise we cannot use it for analysis


for(var i = 0; i < imgList.length;i++){
  if((KeepList.indexOf(imgList[i]["id"].toString().split('/')[4]) >= 0) === true){
      //pluck out each image from the SR collection, perform and NDVI on the image, keep only band names that follow a naming convention
      //similar to 'B11'
      var im = ee.Image(imgList[i]["id"]);
      var NDVI_plus_Bands = getNDVI(im.select('B.+'));
      Map.addLayer(NDVI_plus_Bands);

      //export results of image data to TIFF file to google earth drive
      Export.image.toDrive({
  		image: NDVI_plus_Bands,
  		description: imgList[i]["id"].toString().split('/')[4],
  		scale: 30,
  		fileFormat: 'GeoTiff'
	});
      
  }
  
  else{
    print(imgList[i]["id"].toString() + " is too cloudy and will be excluded from the analysis");
  }
}
