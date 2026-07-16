# `flathead-flows`: Net stream flow in and out of Flathead Lake

## Overview

The water level of Flathead Lake in Montana is an annual [point of contention](https://montanafreepress.org/2025/06/16/tribes-to-reduce-dam-flows-to-keep-flathead-lake-closer-to-full-pool/). Especially in the past few years, complaints abound about the low water levels harming recreation and tourism around the lake. The usual suspects blamed each year include
* federal stream-flow minimums to protect fish and power generation
* mismanagement of the SKQ Dam (formerly Kerr Dam) under the Confederated Salish & Kootenai Tribes' Energy Keepers,
* lower snowpack in the mountains upstream of the lake
* early snowmelt due to hotter late-spring temperatures.

The list goes on, but the main takeaway is that the commonly espoused causes for our drained lake are (1) Governance and (2) Environment. This analysis aims to shed some light on Number 2. By displaying where water streams in and out of Flathead Lake (later, where it rains and snows), this project should help people give the Environment argument at least a fair shake.

The means of displaying Flathead's water flows is a Sankey diagram. Tributaries and reservoirs show up as arrows and blobs on a map, highlighting which streams play the biggest role in keeping the lake full.

## Methodology

See [data/stations.csv](data/stations.csv) for a spreadsheet of the USGS metering stations used in this analysis. USGS has created a [`dataretrieval`](https://water.usgs.gov/catalog/tools/0388b0a4-66ec-47ad-9ba9-07ac621ddd06/) package for Python as a wrapper for the [USGS Water Data APIs](https://api.waterdata.usgs.gov/ogcapi/v0/openapi?f=html#/daily/getDailyFeatures).

Flathead Lake level has been measured in its own Somers datum since April of 1909. If you want, you can subtract 1 foot to convert Somers datum to NGVD29.

### Hydrologic topology

The "hydrologic topology" (i.e. network of which streams and water bodies flow into which other streams and water bodies) is not explicitly encoded in USGS's or USDA's basin codes. Instead, I had to manually select the monitoring stations in and out of Flathead Lake and account for double-counting of tributaries.

Hydrologic topology just refers to how streams are arranged like a graph network. For example, the Whitefish River is a tributary of the Stillwater River, so we consider Whitefish to be upstream of Stillwater in the graph representation of this water system. There seem to be two main ways of writing down these relationships between streams.

1. Pfafstetter Coding System
  * Human-readable method for communicating stream relationships at a glance
2. NHDPlus (National Hydrography Dataset Plus)
  * Would involve crosswalking USGS station IDs with its respective stream's `ComID`

However, both of these codes really just relate tributaries, but this analysis requires knowing whether the actual station location itself is before or after those confluences. For this reason, we use the `is_disjoint` value from [data/stations.csv](data/stations.csv) to denote whether a station's flow can be summed without double-counting.

### Balance equation for monitoring station flows

We should expect the rate of water flowing into Flathead Lake to be roughly comparable to the rate of water flowing out of the lake. They are almost certainly never equal due to dam flow rate restrictions, surface evaporation, precipitation, and discharge not measured by USGS monitoring stations. What we *can* do is compare the sum of station discharges upstream of the lake to the discharge downstream of SKQ Dam (USGS-12372000).

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

### Sources and helpful references
* [SKQ Dam license summary slides](https://www.usbr.gov/pn/hungryhorse/publicengagement/documents/2-2024-03-14_EKI-SKQ_Final.pdf)
  * Slideshow from Energy Keepers, summarizing 2025 federal flow minimum schedule
* [GridInfo](https://www.gridinfo.com/plant/big-fork/6459) (PAID)
  * Hydro project locations and breakdowns
* [Flathead Lakers](https://www.flatheadlakers.org/flathead-lake-levels)
  * Publish a chart with inflows, outflows, net flow, and lake level
    * Only shows the last week of data

# Notes
Article 56 of the FERC-issued license for SKQ Dam specifies a minimum flow schedule.

# AI Diligence

This project made use of Claude throughout. The LLM-assisted tasks were:
* Drafting an AI-human work delegation plan
* Browsing sources for geographic river path data
* Generating template code for the d3.js application
* Consolidating federal minimum flow values for SKQ Dam for the year 2025
  * Manual verification: Sought out official publication from Dep. of Interior to confirm exact dates of minimum flow deviations.

Diligence statement example from Anthropic's "AI Fluency: Framework and Foundations":
>In creating this [document/project/content], I collaborated with [AI assistant name] to assist with [specific tasks: drafting, research, editing, etc.]. I affirm that all AI-generated and co-created content underwent thorough review and evaluation. The final output accurately reflects my understanding, expertise, and intended meaning. While AI assistance was instrumental in the process, I maintain full responsibility for the content, its accuracy, and its presentation. This disclosure is made in the spirit of transparency and to acknowledge the role of AI in the creation process

# Upcoming Plans
I have summarized my current plans for `flathead-flows` here. Plans can include new features and use cases for the web app. I arranged them roughly in order of descending priority.
1. Loop in some subject-matter experts (e.g. officials from Energy Keepers or USGS, lakeside business owners, Flathead Lakers) to my project, especially to differentiate the app from existing data visualizations and to ensure fair representation
   * Consider whether cumulative in/outflows would be a meaningful visualization, as intersections of those two lines represent when the lake has be net filled or drained relative to the chosen start date (i.e. a day when the lake was at minimum pool of 2883ft?)
2. Add data on snow-water equivalent, precipitation, and temperature WITHOUT cluttering the app and turning it into a bloated dashboard
   * Idea: "There can never be more than one chart on screen at a time." (What about facets?)
3. Consider converting the app into a scrollytelling article, which breaks down the many dimensions at play (e.g. climate, ecology, federal regulations, power generation, business interests) and can present those dimensions sequentially
   * Idea: Leave the left-column river map in place and use the right column for dynamic scrollytelling elements. The map highlights different regions of the drainage system depending on the stage of the scrollyteller.
4. Estimate the non-discharge-related factors in changing lake level (specifically, evaporation) by comparing daily lake level changes to total daily net flow.

# Fixes
* Code Cleanup
  * Move all-caps constants to [`eda/utils.py`](eda/utils.py)
* Viz
  * Above or below median flow indicated by dotted arrow, over or underfill with color
  * If using real river geometries, the ridges and wiggles will overlap when line stroke gets big enough
* App
  * Small bugs
    * ~~Date slider visually is set to earliest, but actually lists latest date (July 6, 2026)~~
      * Solution: In d3, set the `#date-slider` `input`'s `value` using property, not attr
    * ~~Arrows at end of river paths can point in weird directions because of last-second squiggles~~
      * Solution: Draw compute arrowhead angle using last 1% of river path points (rather than just last points)
    * ~~Point projection of new river path arrows breaks when zooming on Leaflet map~~
      * Solution: Two birds with one stone, disable zoom and UI features, which we didn't want interfering anyway
    * Time series chart takes up entire right column
    * Time series chart presents **all** dates, should be limited to one season (April-September)
  * Big bugs
    * When using date slider, the discharge out on chart clearly does not match the fhr_out arrow's size changes

# Instructions to test

From project root, run `uv run python -m http.server 8000` and go to [`http://localhost:8000`](http://localhost:8000).
