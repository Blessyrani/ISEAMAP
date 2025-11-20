<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>India Map with State → District Drilldown and Labels</title>

  <!-- Load Highcharts Map and modules  --> 
  <!-- <script src="https://code.highcharts.com/maps/highmaps.js"></script>
  <script src="https://code.highcharts.com/maps/modules/exporting.js"></script>
  <script src="https://code.highcharts.com/maps/modules/data.js"></script>
  <script src="https://code.highcharts.com/maps/modules/drilldown.js"></script> -->
  <script src="highmaps.js"></script>
<script src="exporting.js"></script>
<script src="data.js"></script>
<script src="drilldown.js"></script>
</head>
<body>

  <!-- Map container -->
  <div id="container" style="height: 750px; width: 100%"></div>

  <script>
    async function loadMap() {
      // Convert state names from UPPERCASE to Title Case
      function toTitleCase(str) {
        return str.toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      // Custom values for each state
      const customStateValues = {
        // 'Andhra Pradesh': { participants: 82, workshops: 12 },
        'Tamil Nadu': { participants: 67, workshops: 9 },
        'Kerala': { participants: 45, workshops: 6 },
        'Maharashtra': { participants: 90, workshops: 15 },
        'Karnataka': { participants: 73, workshops: 11 },
        'Gujarat': { participants: 54, workshops: 7 },
        'Odisha': { participants: 34, workshops: 5 },
        'West Bengal': { participants: 61, workshops: 8 },
        'Rajasthan': { participants: 40, workshops: 5 },
        'Uttar Pradesh': { participants: 75, workshops: 10 },
        'Telangana': { participants: 85, workshops: 13 },
        'Madhya Pradesh': { participants: 82, workshops: 10 }
      };

      // Example custom values for districts (expand as needed)
      const customDistrictValues = {
        'Andhra Pradesh': {
          'Anantapur': { participants: 50, workshops: 7 },
          'Chittoor': { participants: 80, workshops: 10 }
        },
        'Gujarat': {
          'Morbi': { participants: 60, workshops: 9 }
        }
      };

      // Fetch state-level India map (TopoJSON)
      const indiaTopo = await fetch('all-indiastates_resend.json') 
        .then(res => res.json());

      // Fetch district-level map (TopoJSON) //IndiaDistrictsresend.json
      const districtTopo = await fetch('IndiaDistricts.json')
        .then(res => res.json());

      // Convert district TopoJSON to Highcharts-readable GeoJSON
      const allDistricts = Highcharts.geojson(districtTopo);

      // Build state-level data for initial view
      const stateData = indiaTopo.objects.default.geometries.map(g => {
        const stateName = g.properties.name;  // State name
        const custom = customStateValues[stateName] ?? { participants: 0, workshops: 0 };
        return {
          'hc-key': g.properties['hc-key'],
          name: stateName,
          drilldown: stateName,
          value: custom.participants,
          custom
        };
      });

      // Build district data grouped by state
      const districtsByState = {};

      allDistricts.forEach(feature => {
        let stateName = toTitleCase(feature.properties.stname); // normalize
        let districtName = feature.properties.dtname;

        feature.name = districtName;

        const districtData = customDistrictValues[stateName]?.[districtName];
        const stateDefaults = customStateValues[stateName] ?? { participants: 0, workshops: 0 };
        const participants = districtData?.participants ?? stateDefaults.participants;
        const workshops = districtData?.workshops ?? stateDefaults.workshops;

        if (!districtsByState[stateName]) {
          districtsByState[stateName] = {
            name: 'Districts of ' + stateName,
            id: stateName,
            data: [],
            mapData: [],
            joinBy: 'name',
            dataLabels: {
              enabled: true,
              allowOverlap: false,
              crop: false,
              format: '{point.name}',
              style: { fontSize: '10px', color: 'black' }
            }
          };
        }

        districtsByState[stateName].data.push({
          name: districtName,
          value: participants,
          custom: { participants, workshops }
        });
        districtsByState[stateName].mapData.push(feature);
      });

      // Render map
      Highcharts.mapChart('container', {
        chart: {
          map: indiaTopo,
          events: {
            drilldown: function (e) {
              const stateName = e.point.name;
              const drillSeries = districtsByState[stateName];
              if (drillSeries) {
                this.addSeriesAsDrilldown(e.point, drillSeries);
              } else {
                alert('No district data found for: ' + stateName);
              }
            },
            drillup: function () {
              this.setTitle({ text: 'India Map with Drilldown to Districts' });
            }
          }
        },
        title: { text: 'India Map with Drilldown to Districts' },
        mapNavigation: { enabled: true, buttonOptions: { verticalAlign: 'bottom' } },
        tooltip: {
          useHTML: true,
          formatter: function () {
            const participants = this.point.custom?.participants ?? this.point.value;
            const workshops = this.point.custom?.workshops ?? '-';
            return `<b>${this.point.name}</b><br>Participants: ${participants}<br>Workshops: ${workshops}`;
          }
        },
        colorAxis: {
          min: 0,
          max: 120,
          stops: [
            [0, '#d4d6daff'],
            [0.5, '#006064'],
            [1, '#006064']
          ]
        },
        series: [{
          name: 'States',
          data: stateData,
          states: { hover: { color: '#FF5722' } },
          dataLabels: { enabled: true, format: '{point.name}' }
        }],
        drilldown: {
          activeDataLabelStyle: { color: '#000', fontWeight: 'bold' },
          drillUpButton: { relativeTo: 'spacingBox', position: { x: 0, y: 100 } }
        },
         credits: { 
    enabled: false  
  }
      });
    }
    loadMap();
  </script>
</body>
</html>
