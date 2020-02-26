/*test script written by Warren Kunkler in support of the UHII project to scope out the time and size requirements for using the EE API
This script is written in javascript for the google earth cloud computing platform. It grabs some landsat OLI
data for the month of May, 2017 from the at surface reflectance archival collection, runs an NDVI on the imagery collection
and stacks the 'B12' NDVI band back with the rest of the stack then saves the imagery to a google drive account for later download*/


//call proxy object from Earth Engine Server representing OLI at surface reflectance collection
//filter based on landsat row and path and date range
var img2 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
.filter(ee.Filter.eq('WRS_PATH',39))
    .filter(ee.Filter.eq('WRS_ROW',35))
                  .filterDate('2017-05-01', '2017-05-31');



//simple NDVI function that takes an input image, calculates the ndvi and adds the band back into the stack
//export the result to the drive
var getNDVI = function(img){
  var ndvi = img.normalizedDifference(['B5', 'B4']).rename('B12');
  
  img.addBands(ndvi);
  

  print("process complete");
  return img;
}

//call the NDVI function on every image within the image collection using the map() function
var withNDVI = img2.map(getNDVI);


//get client side images, DO NOT run a for loop over the server ImageCollection as that may cause the process to fail!
var imgList = withNDVI.getInfo()["features"];
Map.setCenter(-115.1398, 36.1699, 12);

print(withNDVI);

for(var i = 0; i < imgList.length;i++){
  var im = ee.Image(imgList[i]["id"]);
  var im_b_images = im.select('B.+');
  Map.addLayer(im_b_images);
  Export.image.toDrive({
    image: im_b_images,
    description:'OLI_Img_With_NDVI_at_Surface_Reflect',
    scale:30,
    fileFormat: 'GeoTiff'
  });
}

//Second attempt at processing across entire collection

//call proxy object from Earth Engine Server representing OLI at surface reflectance collection
//filter based on landsat row and path and date range
var img2 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
.filter(ee.Filter.eq('WRS_PATH',39))
    .filter(ee.Filter.eq('WRS_ROW',35))
                  .filterDate('2017-05-01', '2017-05-31');



//simple NDVI function that takes an input image, calculates the ndvi and adds the band back into the stack
//export the result to the drive
var getNDVI = function(img){
  var ndvi = img.normalizedDifference(['B5', 'B4']).rename('B12');
  
  return img.addBands(ndvi);
}

var exportOLI = function(img, imgDate){
  Export.image.toDrive({
    image: img,
    description: 'test',
    scale:30,
    fileFormat: 'GeoTiff'
  });
  print(img);
  
  return 0;
}
//call the NDVI function on every image within the image collection using the map() function
var withNDVI = img2.map(getNDVI);


//get client side images, DO NOT run a for loop over the server ImageCollection as that may cause the process to fail!
//var imgList = withNDVI.getInfo()["features"];
Map.setCenter(-115.1398, 36.1699, 12);


var NDVIBands = withNDVI.select('B.+');
print(NDVIBands);
var run = NDVIBands.map(exportOLI);


