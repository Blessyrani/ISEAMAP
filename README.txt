Files:
map.php: The main PHP file with the map code.
all-indiastates_resend.json: TopoJSON data for the state-level map 
INDIA_DISTRICTS.json: TopoJSON data for the district-level map 

 // Convert state names from UPPERCASE to Title Case
      function toTitleCase(str) 
        return str.toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

Files for reference :
-> StateDistrict_Count.xlsx
-> StateDistrict_index.xlsx
