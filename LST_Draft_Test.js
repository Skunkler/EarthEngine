//our TOA and SR collections
var L8_RAD = ee.ImageCollection('LANDSAT/LC08/C01/T1')
.filter(ee.Filter.eq('WRS_PATH',39))
    .filter(ee.Filter.eq('WRS_ROW',35))
                  .filterDate('2017-05-01', '2017-10-31');

var roi = ee.Geometry.Point([-115.1398, 36.1500]).buffer(40000);
Map.addLayer(roi,{color: '0000FF'});


Map.setCenter(-115.1398, 36.1500, 10);

//set a filter on the TOA collection our ROI
var c = L8_RAD.filterBounds(roi);




var imgList = L8_RAD.getInfo()["features"];


var getNDVI = function(img){
  var NDVI = img.normalizedDifference(['B5', 'B4']);
	
	var Min = NDVI.reduceRegion(ee.Reducer.min(), roi);
	var Max = NDVI.reduceRegion(ee.Reducer.max(), roi);
  
  var numMin = Min.values().getNumber(0);
  var numMax = Max.values().getNumber(0);
  
 
 print(numMin, numMax);
	var Pv = img.expression("(((outImgx - abs(Minx))/(Maxx - abs(Minx)))*((outImgx - abs(Minx))/(Maxx - abs(Minx))))",{
	  "outImgx": NDVI,
	  "Minx": numMin,
	  "Maxx": numMax
	});
	
	return Pv;
}


var Emiss = function(img){
  var E = img.expression("0.004 * PV + 0.986", {
    PV: img
  });
  return E;
}



var TOA_Rad = function(img){
  var returnIm = ee.Algorithms.Landsat.calibratedRadiance(Raw);
  return returnIm;
}

var BT = function(imgListObj, TOA_Rad){
  var K2 = ee.Number(imgListObj["properties"]["K2_CONSTANT_BAND_10"]);
  var K1 = ee.Number(imgListObj["properties"]["K1_CONSTANT_BAND_10"]);
  
 var BT = TOA_Rad.expression("(k2/(log(k1/L)+1))-273.15", {
    "k2":K2,
    "k1":K1,
    "L": TOA_Rad
  });
  return BT;
}

var LST = function(BT, E){
  var LSTImg = BT.expression("(BTIm/(1+(0.00115*BTIm/1.4388)*log(EImg)))",{
    "BTIm":BT,
    "EImg":E
  })
  return LSTImg;
}



for(var i = 0; i < imgList.length; i++){
  var im = ee.Image(imgList[i]["id"]).select('B10').toFloat();
  
  var TOA_RadImg = TOA_Rad(imgList[[i]]);
  var BTImg = BT(imgList[i], TOA_RadImg); 
  var NDVIVal = getNDVI(ee.Image(imgList[i]["id"]).toFloat());
  var E = Emiss(NDVIVal);
  
  var LSTImage = LST(BTImg, E);
  Map.addLayer(LSTImage);
  
}