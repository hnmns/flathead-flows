# `flathead-flows`: Net stream flow in and out of Flathead Lake

## Areas of interest

See [data/stations.csv](data/stations.csv) for a spreadsheet of the USGS metering stations used in this analysis.

The "hydrologic topology" (i.e. network of which streams and water bodies flow into which other streams and water bodies) is not explicitly encoded in USGS's or USDA's basin codes. Instead, I had to manually select the monitoring stations in and out of Flathead Lake and account for double-counting of tributaries.

## Sources

### WDFN State Water Conditions (USGS)
With NWISWeb being phased out, [WDFN](https://waterdata.usgs.gov/blog/wdfn-centralized-water-data/) is the new source for daily stream flow data.

Specifically, the [National Water Dashboard](https://dashboard.waterdata.usgs.gov/app/nwd/en/?aoi=default) provides a way to find USGS stations relevant to this analysis. Under the "USGS Monitoring Stations" section under "Layers", I enabled "Streamflow" and "Surface-water Levels".

### NWCC iMap (USDA)

[This link](https://nwcc-apps.sc.egov.usda.gov/imap/#version=2&elements=&networks=!&states=MT&basins=17010208,17010207,17010206,17010209,17010210,17010211&hucs=&minElevation=&maxElevation=&elementSelectType=any&activeOnly=true&activeForecastPointsOnly=true&hucLabels=true&hucIdLabels=false&hucParameterLabels=true&stationLabels=&overlays=&overlays=&basinOpacity=75&basinNoDataOpacity=0&basemapOpacity=100&maskOpacity=0&mode=data&openSections=dataElement,parameter,date,basin,options,elements,location,networks,labels&controlsOpen=true&popup=&popupMulti=&popupBasin=&base=esriNgwm&displayType=basinstation&basinType=8&dataElement=PREC&depth=-8&parameter=PCTMED&frequency=DAILY&duration=wytd&customDuration=&dayPart=E&monthPart=E&forecastPubDay=1&forecastExceedance=50&useMixedPast=true&seqColor=1&divColor=7&scaleType=D&scaleMin=&scaleMax=&referencePeriodType=POR&referenceBegin=1991&referenceEnd=2020&minimumYears=20&hucAssociations=true&relativeDate=-1&lat=48.146&lon=-113.618&zoom=8.0) selects all relevant regions upstream and downstream of Flathead Lake using National Water and Climate Center's iMap. Data include
* **Snow Water Equivalent (SWE)**
* Precipitation
* Streamflow (NB: This is aggregated flow data from other sources including USGS, not original flow data)
and the regions
* North Fork
* Middle Fork
* South Fork
* Stillwater
* Swan
* Flathead Lake

### Helpful references
* [GridInfo](https://www.gridinfo.com/plant/big-fork/6459) (PAID)
  * Hydro project locations and breakdowns

## Methodology
### Hydrologic topology

Hydrologic topology just refers to how streams are arranged like a graph network. For example, the Whitefish River is a tributary of the Stillwater River, so we consider Whitefish to be upstream of Stillwater in the graph representation of this water system. There seem to be two main ways of writing down these relationships between streams.

1. Pfafstetter Coding System
  * Human-readable method for communicating stream relationships at a glance
2. NHDPlus (National Hydrography Dataset Plus)
  * Would involve crosswalking USGS station IDs with its respective stream's `ComID`

However, both of these codes really just relate tributaries, but this analysis requires knowing whether the actual station location itself is before or after those confluences. For this reason, we use the `is_disjoint` value from [data/stations.csv](data/stations.csv) to denote whether a station's flow can be summed without double-counting.

### Balance equation for monitoring station flows

We should expect the rate of water flowing into Flathead Lake to be roughly comparable to the rate of water flowing out of the lake. They are almost certainly never equal due to dam flow rate restrictions, surface evaporation, precipitation, and discharge not measured by USGS monitoring stations. What we *can* do is compare the sum of station discharges upstream of the lake to the discharge downstream of SKQ Dam (USGS-12372000).

## Monitoring stations of interest

