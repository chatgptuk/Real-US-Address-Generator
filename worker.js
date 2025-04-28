addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state') || getRandomState()
    let address, name, gender, phone, country
  
    const remoteProvinces = ['NL', 'NT', 'NU', 'YT'] // Remote Canadian Provinces/Territories
  
    for (let i = 0; i < 20; i++) { // Try up to 20 times to get a detailed address
      const location = getRandomLocationInState(state)
      const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`
  
      const response = await fetch(apiUrl, {
        headers: { 'User-Agent': 'Cloudflare Worker' }
      })
      const data = await response.json()
  
      if (data && data.address) {
        if (data.address.country_code === 'us') {
          if (data.address.house_number && data.address.road && data.address.city) {
            country = 'US'
            address = formatAddress(data.address, state, country)
            break
          }
        } else if (data.address.country_code === 'ca') {
          if (remoteProvinces.includes(state)) {
            // For remote provinces, allow partial addresses
            country = 'CA'
            address = formatAddress(data.address, state, country)
            break
          } else {
            // For other provinces, require detailed address
            if (data.address.house_number && data.address.road && data.address.city) {
              country = 'CA'
              address = formatAddress(data.address, state, country)
              break
            }
          }
        }
      }
    }
  
    if (!address) {
      return new Response('Failed to retrieve detailed address', { status: 500 })
    }
  
    const userResp  = await fetch('https://fakerapi.it/api/v1/persons?_quantity=1&_locale=en_US')
    const userJson  = await userResp.json()
    if (userJson && userJson.data && userJson.data.length > 0) {
      const user = userJson.data[0]
      name   = `${user.firstname} ${user.lastname}`
      gender = user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
      phone = getRandomPhoneNumber(country, state)
    } else {
      name = getRandomName()
      gender = "Unknown"
      phone = getRandomPhoneNumber(country, state)
    }
  
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Real US & Canadian Address Generator</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-direction: column;
          min-height: 100vh;
          background-color: #f0f0f0;
          margin: 0;
        }
        .container {
          text-align: center;
          background: white;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          width: 90%;
          max-width: 600px;
          margin: 20px;
          box-sizing: border-box;
          position: relative;
        }
        .name, .gender, .phone, .address {
          font-size: 1.5em;
          margin-bottom: 10px;
          cursor: pointer;
        }
        .refresh-btn {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .refresh-btn:hover {
          background-color: #0056b3;
        }
        .state-select {
          margin-bottom: 20px;
        }
        .map {
          width: 100%;
          height: 400px;
          border: 0;
        }
        .title {
          font-size: 2em;
          margin: 20px 0;
        }
        .footer {
          margin-top: auto;
          padding: 10px 0;
          background-color: #f0f0f0;
          width: 100%;
          text-align: center;
          font-size: 0.9em;
        }
        .footer a {
          color: #007bff;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
        .copied {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #28a745;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="title">Real US & Canadian Address Generator</div>
      <div class="container">
        <div class="copied" id="copied">Copied!</div>
        <div class="name" onclick="copyToClipboard('${name}')">${name}</div>
        <div class="gender" onclick="copyToClipboard('${gender}')">${gender}</div>
        <div class="phone" onclick="copyToClipboard('${phone.replace(/[()\s-]/g, '')}')">${phone}</div>
        <div class="address" onclick="copyToClipboard('${address}')">${address}</div>
        <button class="refresh-btn" onclick="window.location.reload();">Get Another Address</button>
        <div class="state-select">
          <label for="state">Select State/Province:</label>
          <select id="state" onchange="changeState(this.value)">
            ${getStateOptions(state)}
          </select>
        </div>
        <iframe class="map" src="https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed"></iframe>
      </div>
      <div class="footer">
        © chatgpt.org.uk 2025 All rights reserved | <a href="https://chatgpt.org.uk" target="_blank">https://chatgpt.org.uk</a>
      </div>
      <script>
        function copyToClipboard(text) {
          navigator.clipboard.writeText(text).then(() => {
            const copied = document.getElementById('copied')
            copied.style.display = 'block'
            setTimeout(() => {
              copied.style.display = 'none'
            }, 2000)
          })
        }
        function changeState(state) {
          window.location.href = \`?state=\${state}\`
        }
      </script>
    </body>
    </html>
    `
  
    return new Response(html, {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    })
  }
  
  function getRandomLocationInState(state) {
    const stateCoordinates = {
      // US States
      "AL": [{ lat: 32.377716, lng: -86.300568 }, { lat: 33.520661, lng: -86.802490 }],
      "AK": [{ lat: 61.216583, lng: -149.899597 }, { lat: 58.301598, lng: -134.419998 }],
      "AZ": [{ lat: 33.448376, lng: -112.074036 }, { lat: 34.048927, lng: -111.093735 }],
      "AR": [{ lat: 34.746483, lng: -92.289597 }, { lat: 36.082157, lng: -94.171852 }],
      "CA": [{ lat: 36.778259, lng: -119.417931 }, { lat: 34.052235, lng: -118.243683 }],
      "CO": [{ lat: 39.739235, lng: -104.990250 }, { lat: 38.833881, lng: -104.821365 }],
      "CT": [{ lat: 41.763710, lng: -72.685097 }, { lat: 41.308273, lng: -72.927887 }],
      "DE": [{ lat: 39.739072, lng: -75.539787 }, { lat: 38.774055, lng: -75.139351 }],
      "FL": [{ lat: 30.332184, lng: -81.655647 }, { lat: 25.761681, lng: -80.191788 }],
      "GA": [{ lat: 33.749001, lng: -84.387985 }, { lat: 32.083541, lng: -81.099831 }],
      "HI": [{ lat: 21.306944, lng: -157.858337 }, { lat: 19.896767, lng: -155.582779 }],
      "ID": [{ lat: 43.615021, lng: -116.202316 }, { lat: 47.677683, lng: -116.780466 }],
      "IL": [{ lat: 41.878113, lng: -87.629799 }, { lat: 40.633125, lng: -89.398529 }],
      "IN": [{ lat: 39.768402, lng: -86.158066 }, { lat: 41.593369, lng: -87.346427 }],
      "IA": [{ lat: 41.586834, lng: -93.625000 }, { lat: 42.500000, lng: -94.166672 }],
      "KS": [{ lat: 39.099728, lng: -94.578568 }, { lat: 37.687176, lng: -97.330055 }],
      "KY": [{ lat: 38.252666, lng: -85.758453 }, { lat: 37.839333, lng: -84.270020 }],
      "LA": [{ lat: 30.695366, lng: -91.187393 }, { lat: 29.951065, lng: -90.071533 }],
      "ME": [{ lat: 44.310623, lng: -69.779490 }, { lat: 43.661471, lng: -70.255325 }],
      "MD": [{ lat: 38.978447, lng: -76.492180 }, { lat: 39.290386, lng: -76.612190 }],
      "MA": [{ lat: 42.360081, lng: -71.058884 }, { lat: 42.313373, lng: -71.057083 }],
      "MI": [{ lat: 42.732536, lng: -84.555534 }, { lat: 42.331429, lng: -83.045753 }],
      "MN": [{ lat: 44.953703, lng: -93.089958 }, { lat: 44.977753, lng: -93.265015 }],
      "MS": [{ lat: 32.298756, lng: -90.184807 }, { lat: 32.366806, lng: -88.703705 }],
      "MO": [{ lat: 38.576702, lng: -92.173516 }, { lat: 38.627003, lng: -90.199402 }],
      "MT": [{ lat: 46.878717, lng: -113.996586 }, { lat: 45.783287, lng: -108.500690 }],
      "NE": [{ lat: 41.256538, lng: -95.934502 }, { lat: 40.813618, lng: -96.702595 }],
      "NV": [{ lat: 39.163914, lng: -119.767403 }, { lat: 36.114647, lng: -115.172813 }],
      "NH": [{ lat: 43.208137, lng: -71.538063 }, { lat: 42.995640, lng: -71.454789 }],
      "NJ": [{ lat: 40.058323, lng: -74.405663 }, { lat: 39.364285, lng: -74.422928 }],
      "NM": [{ lat: 35.084385, lng: -106.650421 }, { lat: 32.319939, lng: -106.763653 }],
      "NY": [{ lat: 40.712776, lng: -74.005974 }, { lat: 43.299427, lng: -74.217933 }],
      "NC": [{ lat: 35.779591, lng: -78.638176 }, { lat: 35.227085, lng: -80.843124 }],
      "ND": [{ lat: 46.825905, lng: -100.778275 }, { lat: 46.877186, lng: -96.789803 }],
      "OH": [{ lat: 39.961178, lng: -82.998795 }, { lat: 41.499321, lng: -81.694359 }],
      "OK": [{ lat: 35.467560, lng: -97.516426 }, { lat: 36.153980, lng: -95.992775 }],
      "OR": [{ lat: 44.046236, lng: -123.022029 }, { lat: 45.505917, lng: -122.675049 }],
      "PA": [{ lat: 40.273191, lng: -76.886701 }, { lat: 39.952583, lng: -75.165222 }],
      "RI": [{ lat: 41.824009, lng: -71.412834 }, { lat: 41.580095, lng: -71.477429 }],
      "SC": [{ lat: 34.000710, lng: -81.034814 }, { lat: 32.776474, lng: -79.931051 }],
      "SD": [{ lat: 44.366787, lng: -100.353760 }, { lat: 43.544595, lng: -96.731103 }],
      "TN": [{ lat: 36.162663, lng: -86.781601 }, { lat: 35.149532, lng: -90.048981 }],
      "TX": [{ lat: 30.267153, lng: -97.743057 }, { lat: 29.760427, lng: -95.369804 }],
      "UT": [{ lat: 40.760780, lng: -111.891045 }, { lat: 37.774929, lng: -111.920414 }],
      "VT": [{ lat: 44.260059, lng: -72.575386 }, { lat: 44.475883, lng: -73.212074 }],
      "VA": [{ lat: 37.540726, lng: -77.436050 }, { lat: 36.852924, lng: -75.977982 }],
      "WA": [{ lat: 47.606209, lng: -122.332069 }, { lat: 47.252876, lng: -122.444290 }],
      "WV": [{ lat: 38.349820, lng: -81.632622 }, { lat: 39.629527, lng: -79.955896 }],
      "WI": [{ lat: 43.073051, lng: -89.401230 }, { lat: 43.038902, lng: -87.906471 }],
      "WY": [{ lat: 41.140259, lng: -104.820236 }, { lat: 44.276569, lng: -105.507391 }],
      // Canadian Provinces and Territories
      "AB": [{ lat: 51.044733, lng: -114.071883 }, { lat: 53.546124, lng: -113.493823 }],
      "BC": [{ lat: 49.282729, lng: -123.120738 }, { lat: 48.428421, lng: -123.365644 }],
      "MB": [{ lat: 49.895137, lng: -97.138374 }, { lat: 50.445211, lng: -96.823611 }],
      "NB": [{ lat: 45.963589, lng: -66.643115 }, { lat: 46.510712, lng: -67.255044 }],
      "NL": [{ lat: 53.135509, lng: -57.660435 }, { lat: 50.445211, lng: -57.100000 }],
      "NS": [{ lat: 44.648862, lng: -63.575320 }, { lat: 45.010474, lng: -63.416817 }],
      "ON": [{ lat: 51.253775, lng: -85.323214 }, { lat: 43.653225, lng: -79.383186 }],
      "PE": [{ lat: 46.238240, lng: -63.131074 }, { lat: 46.492424, lng: -63.793013 }],
      "QC": [{ lat: 46.813878, lng: -71.207980 }, { lat: 45.501689, lng: -73.567256 }],
      "SK": [{ lat: 52.939915, lng: -106.450863 }, { lat: 50.445211, lng: -104.618896 }],
      "NT": [{ lat: 64.825544, lng: -115.825340 }, { lat: 61.251955, lng: -114.352482 }],
      "NU": [{ lat: 64.282327, lng: -76.614813 }, { lat: 70.299598, lng: -83.107562 }],
      "YT": [{ lat: 64.282327, lng: -135.000000 }, { lat: 64.000000, lng: -138.000000 }]
    }
    const coordsArray = stateCoordinates[state]
    if (!coordsArray) {
      // Fallback to a default location if state/province not found
      return { lat: 39.8283, lng: -98.5795 } // Geographic center of the contiguous US
    }
    const randomCity = coordsArray[Math.floor(Math.random() * coordsArray.length)]
    const lat = randomCity.lat + (Math.random() - 0.5) * 0.1 // Smaller random offset
    const lng = randomCity.lng + (Math.random() - 0.5) * 0.1
    return { lat, lng }
  }
  
  function formatAddress(address, state, country) {
    const stateAbbreviations = {
      // US States
      "Alabama": "AL",
      "Alaska": "AK",
      "Arizona": "AZ",
      "Arkansas": "AR",
      "California": "CA",
      "Colorado": "CO",
      "Connecticut": "CT",
      "Delaware": "DE",
      "Florida": "FL",
      "Georgia": "GA",
      "Hawaii": "HI",
      "Idaho": "ID",
      "Illinois": "IL",
      "Indiana": "IN",
      "Iowa": "IA",
      "Kansas": "KS",
      "Kentucky": "KY",
      "Louisiana": "LA",
      "Maine": "ME",
      "Maryland": "MD",
      "Massachusetts": "MA",
      "Michigan": "MI",
      "Minnesota": "MN",
      "Mississippi": "MS",
      "Missouri": "MO",
      "Montana": "MT",
      "Nebraska": "NE",
      "Nevada": "NV",
      "New Hampshire": "NH",
      "New Jersey": "NJ",
      "New Mexico": "NM",
      "New York": "NY",
      "North Carolina": "NC",
      "North Dakota": "ND",
      "Ohio": "OH",
      "Oklahoma": "OK",
      "Oregon": "OR",
      "Pennsylvania": "PA",
      "Rhode Island": "RI",
      "South Carolina": "SC",
      "South Dakota": "SD",
      "Tennessee": "TN",
      "Texas": "TX",
      "Utah": "UT",
      "Vermont": "VT",
      "Virginia": "VA",
      "Washington": "WA",
      "West Virginia": "WV",
      "Wisconsin": "WI",
      "Wyoming": "WY",
      // Canadian Provinces and Territories
      "Alberta": "AB",
      "British Columbia": "BC",
      "Manitoba": "MB",
      "New Brunswick": "NB",
      "Newfoundland and Labrador": "NL",
      "Nova Scotia": "NS",
      "Ontario": "ON",
      "Prince Edward Island": "PE",
      "Quebec": "QC",
      "Saskatchewan": "SK",
      "Northwest Territories": "NT",
      "Nunavut": "NU",
      "Yukon": "YT"
    }
    const stateAbbr = stateAbbreviations[address.state] || state
    let formattedAddress = ''
  
    if (address.house_number && address.road && address.city) {
      if (country === 'US') {
        formattedAddress = `${address.house_number} ${address.road}, ${address.city}, ${stateAbbr} ${address.postcode}, United States`
      } else if (country === 'CA') {
        formattedAddress = `${address.house_number} ${address.road}, ${address.city}, ${stateAbbr} ${address.postcode}, Canada`
      }
    } else {
      // For partial addresses in remote provinces
      formattedAddress = `${address.city}, ${stateAbbr} ${address.postcode}, ${country === 'US' ? 'United States' : 'Canada'}`
    }
  
    return formattedAddress
  }
  
  function getRandomPhoneNumber(country, state) {
    const areaCodesUS = {
      "AL": ["205", "251", "256", "334", "938"],
      "AK": ["907"],
      "AZ": ["480", "520", "602", "623", "928"],
      "AR": ["479", "501", "870"],
      "CA": ["209", "213", "310", "323", "408", "415", "424", "510", "530", "559", "562", "619", "626", "650", "661", "707", "714", "760", "805", "818", "831", "858", "909", "916", "925", "949"],
      "CO": ["303", "719", "720", "970"],
      "CT": ["203", "475", "860", "959"],
      "DE": ["302"],
      "FL": ["239", "305", "321", "352", "386", "407", "561", "727", "754", "772", "786", "813", "850", "863", "904", "941", "954"],
      "GA": ["229", "404", "470", "478", "678", "706", "762", "770", "912"],
      "HI": ["808"],
      "ID": ["208", "986"],
      "IL": ["217", "224", "309", "312", "331", "618", "630", "708", "773", "779", "815", "847", "872"],
      "IN": ["219", "260", "317", "463", "574", "765", "812", "930"],
      "IA": ["319", "515", "563", "641", "712"],
      "KS": ["316", "620", "785", "913"],
      "KY": ["270", "364", "502", "606", "859"],
      "LA": ["225", "318", "337", "504", "985"],
      "ME": ["207"],
      "MD": ["240", "301", "410", "443", "667"],
      "MA": ["339", "351", "413", "508", "617", "774", "781", "857", "978"],
      "MI": ["231", "248", "269", "313", "517", "586", "616", "734", "810", "906", "947", "989"],
      "MN": ["218", "320", "507", "612", "651", "763", "952"],
      "MS": ["228", "601", "662", "769"],
      "MO": ["314", "417", "573", "636", "660", "816", "975"],
      "MT": ["406"],
      "NE": ["308", "402", "531"],
      "NV": ["702", "725", "775"],
      "NH": ["603"],
      "NJ": ["201", "551", "609", "732", "848", "856", "862", "908", "973"],
      "NM": ["505", "575"],
      "NY": ["212", "315", "332", "347", "516", "518", "585", "607", "631", "646", "680", "716", "718", "838", "845", "914", "917", "929", "934"],
      "NC": ["252", "336", "704", "743", "828", "910", "919", "980", "984"],
      "ND": ["701"],
      "OH": ["216", "234", "283", "330", "380", "419", "440", "513", "567", "614", "740", "937"],
      "OK": ["405", "539", "580", "918"],
      "OR": ["458", "503", "541", "971"],
      "PA": ["215", "267", "272", "412", "484", "570", "610", "717", "724", "814", "835", "878"],
      "RI": ["401"],
      "SC": ["803", "839", "843", "854", "864"],
      "SD": ["605"],
      "TN": ["423", "615", "629", "731", "865", "901", "931"],
      "TX": ["210", "214", "254", "281", "325", "346", "409", "430", "432", "469", "512", "682", "713", "737", "806", "817", "830", "832", "903", "915", "936", "940", "956", "972", "979"],
      "UT": ["385", "435", "801"],
      "VT": ["802"],
      "VA": ["276", "434", "540", "571", "703", "757", "804"],
      "WA": ["206", "253", "360", "425", "509"],
      "WV": ["304", "681"],
      "WI": ["262", "414", "534", "608", "715", "920"],
      "WY": ["307"]
    }
  
    const areaCodesCanada = {
      "AB": ["403", "587", "825"],
      "BC": ["236", "250", "604", "672", "778"],
      "MB": ["204", "431"],
      "NB": ["506"],
      "NL": ["709"],
      "NS": ["782", "902"],
      "ON": ["226", "249", "289", "343", "365", "416", "437", "519", "548", "613", "639", "647", "705", "807", "905"],
      "PE": ["902"],
      "QC": ["418", "438", "450", "514", "579", "581", "819", "873"],
      "SK": ["306", "639"],
      "NT": ["867"],
      "NU": ["867"],
      "YT": ["867"]
    }
  
    let areaCodeList = []
    if (country === 'US') {
      areaCodeList = areaCodesUS[state] || ["000"]
    } else if (country === 'CA') {
      areaCodeList = areaCodesCanada[state] || ["000"]
    }
    const areaCode = areaCodeList[Math.floor(Math.random() * areaCodeList.length)]
    const exchangeCode = Math.floor(200 + Math.random() * 700).toString().padStart(3, '0')
    const lineNumber = Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0')
    return `(${areaCode}) ${exchangeCode}-${lineNumber}`
  }
  
  function getRandomState() {
    const states = [
      // US States
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
      "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV",
      "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
      "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
      "VT", "VA", "WA", "WV", "WI", "WY",
      // Canadian Provinces and Territories
      "AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK",
      "NT", "NU", "YT"
    ]
    return states[Math.floor(Math.random() * states.length)]
  }
  
  function getStateOptions(selectedState) {
    const states = [
      // US States
      { full: "Alabama", abbr: "AL", country: "US" },
      { full: "Alaska", abbr: "AK", country: "US" },
      { full: "Arizona", abbr: "AZ", country: "US" },
      { full: "Arkansas", abbr: "AR", country: "US" },
      { full: "California", abbr: "CA", country: "US" },
      { full: "Colorado", abbr: "CO", country: "US" },
      { full: "Connecticut", abbr: "CT", country: "US" },
      { full: "Delaware", abbr: "DE", country: "US" },
      { full: "Florida", abbr: "FL", country: "US" },
      { full: "Georgia", abbr: "GA", country: "US" },
      { full: "Hawaii", abbr: "HI", country: "US" },
      { full: "Idaho", abbr: "ID", country: "US" },
      { full: "Illinois", abbr: "IL", country: "US" },
      { full: "Indiana", abbr: "IN", country: "US" },
      { full: "Iowa", abbr: "IA", country: "US" },
      { full: "Kansas", abbr: "KS", country: "US" },
      { full: "Kentucky", abbr: "KY", country: "US" },
      { full: "Louisiana", abbr: "LA", country: "US" },
      { full: "Maine", abbr: "ME", country: "US" },
      { full: "Maryland", abbr: "MD", country: "US" },
      { full: "Massachusetts", abbr: "MA", country: "US" },
      { full: "Michigan", abbr: "MI", country: "US" },
      { full: "Minnesota", abbr: "MN", country: "US" },
      { full: "Mississippi", abbr: "MS", country: "US" },
      { full: "Missouri", abbr: "MO", country: "US" },
      { full: "Montana", abbr: "MT", country: "US" },
      { full: "Nebraska", abbr: "NE", country: "US" },
      { full: "Nevada", abbr: "NV", country: "US" },
      { full: "New Hampshire", abbr: "NH", country: "US" },
      { full: "New Jersey", abbr: "NJ", country: "US" },
      { full: "New Mexico", abbr: "NM", country: "US" },
      { full: "New York", abbr: "NY", country: "US" },
      { full: "North Carolina", abbr: "NC", country: "US" },
      { full: "North Dakota", abbr: "ND", country: "US" },
      { full: "Ohio", abbr: "OH", country: "US" },
      { full: "Oklahoma", abbr: "OK", country: "US" },
      { full: "Oregon", abbr: "OR", country: "US" },
      { full: "Pennsylvania", abbr: "PA", country: "US" },
      { full: "Rhode Island", abbr: "RI", country: "US" },
      { full: "South Carolina", abbr: "SC", country: "US" },
      { full: "South Dakota", abbr: "SD", country: "US" },
      { full: "Tennessee", abbr: "TN", country: "US" },
      { full: "Texas", abbr: "TX", country: "US" },
      { full: "Utah", abbr: "UT", country: "US" },
      { full: "Vermont", abbr: "VT", country: "US" },
      { full: "Virginia", abbr: "VA", country: "US" },
      { full: "Washington", abbr: "WA", country: "US" },
      { full: "West Virginia", abbr: "WV", country: "US" },
      { full: "Wisconsin", abbr: "WI", country: "US" },
      { full: "Wyoming", abbr: "WY", country: "US" },
      // Canadian Provinces and Territories
      { full: "Alberta", abbr: "AB", country: "CA" },
      { full: "British Columbia", abbr: "BC", country: "CA" },
      { full: "Manitoba", abbr: "MB", country: "CA" },
      { full: "New Brunswick", abbr: "NB", country: "CA" },
      { full: "Newfoundland and Labrador", abbr: "NL", country: "CA" },
      { full: "Nova Scotia", abbr: "NS", country: "CA" },
      { full: "Ontario", abbr: "ON", country: "CA" },
      { full: "Prince Edward Island", abbr: "PE", country: "CA" },
      { full: "Quebec", abbr: "QC", country: "CA" },
      { full: "Saskatchewan", abbr: "SK", country: "CA" },
      { full: "Northwest Territories", abbr: "NT", country: "CA" },
      { full: "Nunavut", abbr: "NU", country: "CA" },
      { full: "Yukon", abbr: "YT", country: "CA" }
    ]
    return states.map(state => 
      `<option value="${state.abbr}" ${state.abbr === selectedState ? 'selected' : ''}>${state.full} (${state.abbr}) - ${state.country === 'US' ? 'USA' : 'Canada'}</option>`
    ).join('')
  }
  
  function getRandomName() {
    const firstNames = ["John", "Jane", "Alex", "Emily", "Chris", "Katie", "Mike", "Laura", "David", "Sarah"]
    const lastNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    return `${firstName} ${lastName}`
  }
  
  function getRandomState() {
    const states = [
      // US States
      "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
      "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
      "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV",
      "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
      "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
      "VT", "VA", "WA", "WV", "WI", "WY",
      // Canadian Provinces and Territories
      "AB", "BC", "MB", "NB", "NL", "NS", "ON", "PE", "QC", "SK",
      "NT", "NU", "YT"
    ]
    return states[Math.floor(Math.random() * states.length)]
  }
  
  function getStateOptions(selectedState) {
    const states = [
      // US States
      { full: "Alabama", abbr: "AL", country: "US" },
      { full: "Alaska", abbr: "AK", country: "US" },
      { full: "Arizona", abbr: "AZ", country: "US" },
      { full: "Arkansas", abbr: "AR", country: "US" },
      { full: "California", abbr: "CA", country: "US" },
      { full: "Colorado", abbr: "CO", country: "US" },
      { full: "Connecticut", abbr: "CT", country: "US" },
      { full: "Delaware", abbr: "DE", country: "US" },
      { full: "Florida", abbr: "FL", country: "US" },
      { full: "Georgia", abbr: "GA", country: "US" },
      { full: "Hawaii", abbr: "HI", country: "US" },
      { full: "Idaho", abbr: "ID", country: "US" },
      { full: "Illinois", abbr: "IL", country: "US" },
      { full: "Indiana", abbr: "IN", country: "US" },
      { full: "Iowa", abbr: "IA", country: "US" },
      { full: "Kansas", abbr: "KS", country: "US" },
      { full: "Kentucky", abbr: "KY", country: "US" },
      { full: "Louisiana", abbr: "LA", country: "US" },
      { full: "Maine", abbr: "ME", country: "US" },
      { full: "Maryland", abbr: "MD", country: "US" },
      { full: "Massachusetts", abbr: "MA", country: "US" },
      { full: "Michigan", abbr: "MI", country: "US" },
      { full: "Minnesota", abbr: "MN", country: "US" },
      { full: "Mississippi", abbr: "MS", country: "US" },
      { full: "Missouri", abbr: "MO", country: "US" },
      { full: "Montana", abbr: "MT", country: "US" },
      { full: "Nebraska", abbr: "NE", country: "US" },
      { full: "Nevada", abbr: "NV", country: "US" },
      { full: "New Hampshire", abbr: "NH", country: "US" },
      { full: "New Jersey", abbr: "NJ", country: "US" },
      { full: "New Mexico", abbr: "NM", country: "US" },
      { full: "New York", abbr: "NY", country: "US" },
      { full: "North Carolina", abbr: "NC", country: "US" },
      { full: "North Dakota", abbr: "ND", country: "US" },
      { full: "Ohio", abbr: "OH", country: "US" },
      { full: "Oklahoma", abbr: "OK", country: "US" },
      { full: "Oregon", abbr: "OR", country: "US" },
      { full: "Pennsylvania", abbr: "PA", country: "US" },
      { full: "Rhode Island", abbr: "RI", country: "US" },
      { full: "South Carolina", abbr: "SC", country: "US" },
      { full: "South Dakota", abbr: "SD", country: "US" },
      { full: "Tennessee", abbr: "TN", country: "US" },
      { full: "Texas", abbr: "TX", country: "US" },
      { full: "Utah", abbr: "UT", country: "US" },
      { full: "Vermont", abbr: "VT", country: "US" },
      { full: "Virginia", abbr: "VA", country: "US" },
      { full: "Washington", abbr: "WA", country: "US" },
      { full: "West Virginia", abbr: "WV", country: "US" },
      { full: "Wisconsin", abbr: "WI", country: "US" },
      { full: "Wyoming", abbr: "WY", country: "US" },
      // Canadian Provinces and Territories
      { full: "Alberta", abbr: "AB", country: "CA" },
      { full: "British Columbia", abbr: "BC", country: "CA" },
      { full: "Manitoba", abbr: "MB", country: "CA" },
      { full: "New Brunswick", abbr: "NB", country: "CA" },
      { full: "Newfoundland and Labrador", abbr: "NL", country: "CA" },
      { full: "Nova Scotia", abbr: "NS", country: "CA" },
      { full: "Ontario", abbr: "ON", country: "CA" },
      { full: "Prince Edward Island", abbr: "PE", country: "CA" },
      { full: "Quebec", abbr: "QC", country: "CA" },
      { full: "Saskatchewan", abbr: "SK", country: "CA" },
      { full: "Northwest Territories", abbr: "NT", country: "CA" },
      { full: "Nunavut", abbr: "NU", country: "CA" },
      { full: "Yukon", abbr: "YT", country: "CA" }
    ]
    return states.map(state => 
      `<option value="${state.abbr}" ${state.abbr === selectedState ? 'selected' : ''}>${state.full} (${state.abbr}) - ${state.country === 'US' ? 'USA' : 'Canada'}</option>`
    ).join('')
  }
  
