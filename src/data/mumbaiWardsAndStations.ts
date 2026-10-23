/**
 * Authoritative Mumbai Administrative & Environmental Geography
 * 24 Municipal Corporation of Greater Mumbai (MCGM / BMC) Wards
 * Verified CPCB / MPCB CAAQMS Monitoring Stations & Major Activity Nodes
 */

import { WardInfo, MonitoringStation, KnownPollutionHotspot } from '../types';

export const MUMBAI_WARDS: WardInfo[] = [
  {
    code: 'A',
    name: 'Colaba, Fort, Ballard Estate, Nariman Point',
    officeLocation: '134E, Shahid Bhagat Singh Road, Fort',
    population: 185000,
    areaKm2: 12.5,
    centroid: [18.9220, 72.8347],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-colaba',
    keyConcerns: ['Port freight traffic', 'Ballard Pier marine emissions', 'South Mumbai coastal humidity']
  },
  {
    code: 'B',
    name: 'Sandhurst Road, Dongri, Mandvi, Umerkhadi',
    officeLocation: '121, Ramchandra Bhatt Marg, Babula Tank Road',
    population: 127000,
    areaKm2: 2.8,
    centroid: [18.9560, 72.8390],
    coverageStatus: 'NEIGHBORING_PROXY',
    primaryStationId: 'station-mazgaon',
    keyConcerns: ['Dense narrow market street canyons', 'Heavy goods diesel vehicles', 'No direct CAAQMS']
  },
  {
    code: 'C',
    name: 'Marine Lines, Chira Bazaar, Kalbadevi, Bhuleshwar',
    officeLocation: '76, Shrikant Palekar Marg, Marine Lines',
    population: 166000,
    areaKm2: 1.8,
    centroid: [18.9500, 72.8270],
    coverageStatus: 'NEIGHBORING_PROXY',
    primaryStationId: 'station-mazgaon',
    keyConcerns: ['High commercial density', 'Goldsmithing / jewelers polishing fumes', 'Unmonitored Ward gap']
  },
  {
    code: 'D',
    name: 'Grant Road, Malabar Hill, Walkeshwar, Tardeo',
    officeLocation: 'Jobanputra Compound, Nana Chowk, Grant Road',
    population: 346000,
    areaKm2: 8.0,
    centroid: [18.9660, 72.8090],
    coverageStatus: 'NEIGHBORING_PROXY',
    primaryStationId: 'station-worli',
    keyConcerns: ['Coastal sea breeze modulation', 'Haji Ali / Coastal road construction zone']
  },
  {
    code: 'E',
    name: 'Byculla, Mazgaon, Mumbai Central, Nagpada',
    officeLocation: '10, Shaikh Hafizuddin Marg, Sankli Street, Byculla',
    population: 393000,
    areaKm2: 7.4,
    centroid: [18.9730, 72.8380],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-mazgaon',
    keyConcerns: ['Eastern Freeway diesel corridor', 'Dockyard workshops', 'High building entrapment']
  },
  {
    code: 'F/N',
    name: 'Matunga, Sion, Wadala, Antop Hill',
    officeLocation: 'Plot No. 96, Bhau Daji Road, King’s Circle, Matunga',
    population: 529000,
    areaKm2: 13.0,
    centroid: [19.0340, 72.8610],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-sion',
    keyConcerns: ['Sion circle heavy arterial congestion', 'Dharavi border workshops', 'Eastern harbor line proximity']
  },
  {
    code: 'F/S',
    name: 'Parel, Lalbaug, Sewri, Naigaon',
    officeLocation: 'Jagannath Bhatankar Marg, Parel',
    population: 360000,
    areaKm2: 14.0,
    centroid: [19.0020, 72.8420],
    coverageStatus: 'UNMONITORED_GAP',
    keyConcerns: ['Sewri-Nhava Sheva MTHL connector traffic', 'Hospital hub (KEM, Tata Memorial)', 'Active high-rise redevelopment']
  },
  {
    code: 'G/N',
    name: 'Dadar, Dharavi, Mahim',
    officeLocation: 'Harishchandra Yelve Marg, Dadar West',
    population: 599000,
    areaKm2: 9.1,
    centroid: [19.0350, 72.8410],
    coverageStatus: 'NEIGHBORING_PROXY',
    primaryStationId: 'station-sion',
    keyConcerns: ['Dharavi small-scale leather, recycling & pottery kilns', 'Mahim creek stagnation']
  },
  {
    code: 'G/S',
    name: 'Worli, Lower Parel, Prabhadevi, Mahalaxmi',
    officeLocation: 'N. M. Joshi Marg, Elphinstone Road West',
    population: 377000,
    areaKm2: 10.0,
    centroid: [19.0120, 72.8220],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-worli',
    keyConcerns: ['Coastal Road construction corridor', 'Lower Parel commercial tower canyon effects']
  },
  {
    code: 'H/E',
    name: 'Bandra East, Santacruz East, Khar East, BKC',
    officeLocation: 'TPS-5, Prabhat Colony, Santacruz East',
    population: 557000,
    areaKm2: 13.5,
    centroid: [19.0620, 72.8590],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-bkc',
    keyConcerns: ['Western Express Highway junction', 'BKC commercial traffic & Metro Line 3 hubs', 'Airport flight path']
  },
  {
    code: 'H/W',
    name: 'Bandra West, Khar West, Santacruz West',
    officeLocation: 'Saint Martin Road, Bandra West',
    population: 307000,
    areaKm2: 11.5,
    centroid: [19.0600, 72.8300],
    coverageStatus: 'NEIGHBORING_PROXY',
    primaryStationId: 'station-bkc',
    keyConcerns: ['Coastal wind dispersion', 'SV Road & Linking Road traffic congestion']
  },
  {
    code: 'K/E',
    name: 'Andheri East, Jogeshwari East, MIDC, Marol',
    officeLocation: 'Azad Road, Gundavali, Andheri East',
    population: 823000,
    areaKm2: 24.8,
    centroid: [19.1220, 72.8650],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-andheri-midc',
    keyConcerns: ['MIDC Chakala industrial operations', 'Chhatrapati Shivaji International Airport apron emissions', 'JVLR & WEH junction']
  },
  {
    code: 'K/W',
    name: 'Andheri West, Versova, Juhu, Oshiwara',
    officeLocation: 'Paliram Road, Near S.V. Road, Andheri West',
    population: 749000,
    areaKm2: 23.4,
    centroid: [19.1280, 72.8280],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-vile-parle',
    keyConcerns: ['Metro Line 6 construction corridor', 'Lokhandwala & Oshiwara traffic corridors', 'Versova coastal creeks']
  },
  {
    code: 'L',
    name: 'Kurla, Sakinaka, Asalpha, Chunabhatti',
    officeLocation: 'Laxmanrao Yadav Market Bldg, S.G. Barve Marg, Kurla West',
    population: 902000,
    areaKm2: 15.9,
    centroid: [19.0720, 72.8800],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-kurla',
    keyConcerns: ['LBS Marg persistent traffic bottlenecks', 'Sakinaka industrial auto workshops', 'Mithi River valley stagnation']
  },
  {
    code: 'M/E',
    name: 'Govandi, Mankhurd, Shivaji Nagar, Deonar',
    officeLocation: 'Near Railway Station, Chembur-Govandi Road',
    population: 807000,
    areaKm2: 32.5,
    centroid: [19.0550, 72.9200],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-deonar',
    keyConcerns: ['Deonar municipal solid waste dumping ground', 'Biomedical waste incinerator proximity', 'Highest respiratory morbidity index']
  },
  {
    code: 'M/W',
    name: 'Chembur, Tilak Nagar, Mahul',
    officeLocation: 'Sharadbhau Acharya Marg, Near Natraj Cinema, Chembur',
    population: 411000,
    areaKm2: 19.5,
    centroid: [19.0510, 72.8950],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-chembur',
    keyConcerns: ['Mahul petrochem & BPCL/HPCL refineries', 'Fertilizer manufacturing', 'Sion-Panvel Highway corridor']
  },
  {
    code: 'N',
    name: 'Ghatkopar, Vikhroli West, Pant Nagar',
    officeLocation: 'Jawahar Road, Ghatkopar East',
    population: 622000,
    areaKm2: 26.0,
    centroid: [19.0910, 72.9100],
    coverageStatus: 'NEIGHBORING_PROXY',
    primaryStationId: 'station-kurla',
    keyConcerns: ['LBS Marg commercial corridor', 'Eastern Express Highway corridor', 'Unmonitored Ward core']
  },
  {
    code: 'P/N',
    name: 'Malad West, Malad East, Marve, Madh',
    officeLocation: 'Liberty Garden, Mamletdarwadi, Malad West',
    population: 946000,
    areaKm2: 46.7,
    centroid: [19.1850, 72.8420],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-malad',
    keyConcerns: ['Mindspace IT corridor & Link Road congestion', 'Madh Island coastal buffer', 'Active real estate high-rise projects']
  },
  {
    code: 'P/S',
    name: 'Goregaon West, Goregaon East',
    officeLocation: 'Near Railway Station, Goregaon West',
    population: 468000,
    areaKm2: 24.4,
    centroid: [19.1620, 72.8480],
    coverageStatus: 'NEIGHBORING_PROXY',
    primaryStationId: 'station-malad',
    keyConcerns: ['Aarey colony green buffer vs Goregaon-Mulund Link Road construction', 'Film City traffic']
  },
  {
    code: 'R/C',
    name: 'Borivali West, Borivali East',
    officeLocation: 'Chandavarkar Road, Borivali West',
    population: 562000,
    areaKm2: 50.0,
    centroid: [19.2310, 72.8580],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-borivali',
    keyConcerns: ['Sanjay Gandhi National Park (SGNP) boundary', 'Western Railway junction', 'Suburban traffic hub']
  },
  {
    code: 'R/N',
    name: 'Dahisar West, Dahisar East',
    officeLocation: 'R.T.O. Office Compound, Dahisar West',
    population: 431000,
    areaKm2: 18.0,
    centroid: [19.2550, 72.8620],
    coverageStatus: 'UNMONITORED_GAP',
    keyConcerns: ['Northern municipal octroi/toll checkpost queuing', 'Inter-state truck congestion', 'Unmonitored Ward']
  },
  {
    code: 'R/S',
    name: 'Kandivali West, Kandivali East, Charkop',
    officeLocation: 'M.G. Cross Road No. 2, Kandivali West',
    population: 691000,
    areaKm2: 17.8,
    centroid: [19.2060, 72.8400],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-kandivali',
    keyConcerns: ['Charkop industrial area workshops', 'Dense residential apartment clusters', 'Link road metro corridor']
  },
  {
    code: 'S',
    name: 'Bhandup, Powai, Kanjurmarg, Vikhroli East',
    officeLocation: 'L.B.S. Marg, Near Mangatram Petrol Pump, Bhandup West',
    population: 743000,
    areaKm2: 64.0,
    centroid: [19.1380, 72.9250],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-powai',
    keyConcerns: ['Kanjurmarg landfill site', 'Powai Lake basin microclimate', 'JVLR east-west arterial corridor']
  },
  {
    code: 'T',
    name: 'Mulund West, Mulund East, Nahur',
    officeLocation: 'Lala Devidayal Road, Mulund West',
    population: 341000,
    areaKm2: 45.4,
    centroid: [19.1720, 72.9520],
    coverageStatus: 'DIRECT_STATION',
    primaryStationId: 'station-mulund',
    keyConcerns: ['Thane district cross-border regional transport', 'Eastern toll plaza diesel queues', 'Yogi Hills foothill thermal inversions']
  }
];

export const MUMBAI_STATIONS: MonitoringStation[] = [
  {
    id: 'station-colaba',
    name: 'Colaba (Navy Nagar)',
    cpcbId: 'site_5101',
    ward: 'A',
    lat: 18.9067,
    lng: 72.8147,
    operator: 'IITM_SAFAR',
    environment: 'COASTAL',
    address: 'Navy Nagar, Near Tata Institute of Fundamental Research (TIFR), Colaba',
    elevationM: 8,
    commissionedDate: '2015-06-15',
    hasActiveFeed: true,
    notes: 'Southern tip of Mumbai. High maritime influence, strong sea-breeze dispersion during daytime.'
  },
  {
    id: 'station-mazgaon',
    name: 'Mazgaon (Dockyard Road)',
    cpcbId: 'site_5102',
    ward: 'E',
    lat: 18.9680,
    lng: 72.8460,
    operator: 'CPCB',
    environment: 'TRAFFIC_CORRIDOR',
    address: 'Near Dockyard Road Railway Station, Eastern Harbor Corridor, Mazgaon',
    elevationM: 11,
    commissionedDate: '2016-11-20',
    hasActiveFeed: true,
    notes: 'Proximity to Mumbai Port Trust docklands, Eastern Freeway, and diesel container traffic.'
  },
  {
    id: 'station-worli',
    name: 'Worli (Siddhivinayak / Municipal HQ)',
    cpcbId: 'site_5103',
    ward: 'G/S',
    lat: 19.0178,
    lng: 72.8183,
    operator: 'MPCB',
    environment: 'COASTAL',
    address: 'Dr. E. Moses Road, MPCB Environment Bhavan, Worli',
    elevationM: 10,
    commissionedDate: '2014-03-10',
    hasActiveFeed: true,
    notes: 'Directly impacted by Coastal Road reclamation activities and Worli sea-face winds.'
  },
  {
    id: 'station-sion',
    name: 'Sion (Maharashtra Nature Park)',
    cpcbId: 'site_5104',
    ward: 'F/N',
    lat: 19.0434,
    lng: 72.8597,
    operator: 'MPCB',
    environment: 'ECOLOGICAL_BUFFER',
    address: 'Maharashtra Nature Park, Sion-Bandra Link Road, Dharavi Border',
    elevationM: 7,
    commissionedDate: '2017-02-12',
    hasActiveFeed: true,
    notes: 'Green lung boundary juxtaposed against Dharavi informal workshops and Sion circle arterial road.'
  },
  {
    id: 'station-bkc',
    name: 'Bandra Kurla Complex (BKC)',
    cpcbId: 'site_5105',
    ward: 'H/E',
    lat: 19.0657,
    lng: 72.8687,
    operator: 'MPCB',
    environment: 'TRAFFIC_CORRIDOR',
    address: 'MMRDA Office Grounds, E-Block, Bandra Kurla Complex',
    elevationM: 12,
    commissionedDate: '2015-08-01',
    hasActiveFeed: true,
    notes: 'Major financial hub. Heavy stop-and-go vehicular traffic and active metro rail construction shafts.'
  },
  {
    id: 'station-kurla',
    name: 'Kurla (LBS Marg)',
    cpcbId: 'site_5106',
    ward: 'L',
    lat: 19.0726,
    lng: 72.8845,
    operator: 'MPCB',
    environment: 'TRAFFIC_CORRIDOR',
    address: 'Lal Bahadur Shastri Marg, Municipal School Compound, Kurla West',
    elevationM: 14,
    commissionedDate: '2018-01-25',
    hasActiveFeed: true,
    notes: 'Central suburban choke point. Low terrain basin in Mithi river valley, prone to stagnation.'
  },
  {
    id: 'station-chembur',
    name: 'Chembur (TISS Campus)',
    cpcbId: 'site_5107',
    ward: 'M/W',
    lat: 19.0522,
    lng: 72.8994,
    operator: 'MPCB',
    environment: 'INDUSTRIAL',
    address: 'Tata Institute of Social Sciences, VN Purav Marg, Deonar Farm Road, Chembur',
    elevationM: 18,
    commissionedDate: '2015-04-18',
    hasActiveFeed: true,
    notes: 'Downwind of Trombay thermal power station, BPCL/HPCL refineries, and RCF fertilizer facility.'
  },
  {
    id: 'station-deonar',
    name: 'Deonar (Govandi / MSW Landfill Edge)',
    cpcbId: 'site_5108',
    ward: 'M/E',
    lat: 19.0600,
    lng: 72.9150,
    operator: 'IITM_SAFAR',
    environment: 'INDUSTRIAL',
    address: 'Near Deonar Abattoir & BMC Municipal Solid Waste Processing Facility, Govandi East',
    elevationM: 15,
    commissionedDate: '2016-09-05',
    hasActiveFeed: true,
    notes: 'Close proximity to 132-hectare Deonar dumping ground, episodic open combustion & VOCs.'
  },
  {
    id: 'station-vile-parle',
    name: 'Vile Parle West (Juhu / SV Road)',
    cpcbId: 'site_5109',
    ward: 'K/W',
    lat: 19.0988,
    lng: 72.8526,
    operator: 'CPCB',
    environment: 'RESIDENTIAL',
    address: 'Nanavati Hospital Junction / SV Road, Vile Parle West',
    elevationM: 11,
    commissionedDate: '2019-03-30',
    hasActiveFeed: true,
    notes: 'Western suburban arterial strip. Airport takeoff corridor overflight impact.'
  },
  {
    id: 'station-andheri-midc',
    name: 'Andheri East (MIDC Chakala)',
    cpcbId: 'site_5110',
    ward: 'K/E',
    lat: 19.1197,
    lng: 72.8664,
    operator: 'MPCB',
    environment: 'INDUSTRIAL',
    address: 'MIDC Central Road, Chakala Industrial Area, Andheri East',
    elevationM: 22,
    commissionedDate: '2016-05-14',
    hasActiveFeed: true,
    notes: 'Light manufacturing, printing, packaging, and commercial freight logistics hub.'
  },
  {
    id: 'station-powai',
    name: 'Powai (IIT Bombay Campus)',
    cpcbId: 'site_5111',
    ward: 'S',
    lat: 19.1334,
    lng: 72.9133,
    operator: 'MPCB',
    environment: 'ECOLOGICAL_BUFFER',
    address: 'Department of Civil & Environmental Engineering, IIT Bombay, Powai',
    elevationM: 45,
    commissionedDate: '2016-10-10',
    hasActiveFeed: true,
    notes: 'Reference background station with dense campus canopy, lake microclimate, and low local traffic.'
  },
  {
    id: 'station-bhandup',
    name: 'Bhandup (Complex / LBS)',
    cpcbId: 'site_5112',
    ward: 'S',
    lat: 19.1480,
    lng: 72.9372,
    operator: 'IITM_SAFAR',
    environment: 'INDUSTRIAL',
    address: 'Village Road, Near Bhandup Complex Water Filtration Plant, Bhandup West',
    elevationM: 28,
    commissionedDate: '2017-08-20',
    hasActiveFeed: true,
    notes: 'Industrial-residential interface. Kanjurmarg landfill is ~2.8 km south-southeast.'
  },
  {
    id: 'station-malad',
    name: 'Malad West (Link Road)',
    cpcbId: 'site_5113',
    ward: 'P/N',
    lat: 19.1860,
    lng: 72.8485,
    operator: 'MPCB',
    environment: 'TRAFFIC_CORRIDOR',
    address: 'New Link Road, Mindspace Commercial Zone, Malad West',
    elevationM: 12,
    commissionedDate: '2017-12-05',
    hasActiveFeed: true,
    notes: 'Western suburban heavy commercial hub. High traffic volume with coastal estuary winds.'
  },
  {
    id: 'station-kandivali',
    name: 'Kandivali West (Charkop)',
    cpcbId: 'site_5114',
    ward: 'R/S',
    lat: 19.2045,
    lng: 72.8376,
    operator: 'MPCB',
    environment: 'INDUSTRIAL',
    address: 'Sector 8, Charkop Industrial Estate, Kandivali West',
    elevationM: 10,
    commissionedDate: '2020-02-18',
    hasActiveFeed: true,
    notes: 'Proximity to automotive repair clusters, metal fabrication units, and coastal creek mangroves.'
  },
  {
    id: 'station-borivali',
    name: 'Borivali East (SGNP Gateway)',
    cpcbId: 'site_5115',
    ward: 'R/C',
    lat: 19.2294,
    lng: 72.8604,
    operator: 'CPCB',
    environment: 'ECOLOGICAL_BUFFER',
    address: 'Near Sanjay Gandhi National Park Main Entrance, Western Express Highway, Borivali East',
    elevationM: 26,
    commissionedDate: '2016-04-11',
    hasActiveFeed: true,
    notes: 'Forest edge buffer. Frequently serves as low regional reference background during easterly winds.'
  },
  {
    id: 'station-mulund',
    name: 'Mulund West (MTNL / LBS)',
    cpcbId: 'site_5116',
    ward: 'T',
    lat: 19.1726,
    lng: 72.9565,
    operator: 'CPCB',
    environment: 'RESIDENTIAL',
    address: 'Near MTNL Exchange, LBS Marg, Mulund West',
    elevationM: 20,
    commissionedDate: '2018-09-15',
    hasActiveFeed: true,
    notes: 'North-eastern gateway to Thane. Foothill inversion traps pollutants during winter mornings.'
  }
];

export const KNOWN_HOTSPOTS: KnownPollutionHotspot[] = [
  {
    id: 'hotspot-coastal-road-worli',
    name: 'Mumbai Coastal Road Project (Worli / Haji Ali Sector)',
    category: 'INFRASTRUCTURE_CONSTRUCTION',
    ward: 'G/S',
    lat: 19.0150,
    lng: 72.8120,
    description: 'Extensive coastal reclamation, heavy earthmoving, rock filling, and open aggregate transit.',
    knownMitigationRequirements: [
      'Continuous water sprinkling along unpaved haul roads',
      'Wheel washing bays at all truck egress points',
      'Anti-smog guns operating along active reclamation zones',
      'Tarpaulin covers on 100% of dumpers transport aggregate'
    ]
  },
  {
    id: 'hotspot-metro-line-3-bkc',
    name: 'Metro Line 3 BKC Interchange & Mithi River Shaft',
    category: 'INFRASTRUCTURE_CONSTRUCTION',
    ward: 'H/E',
    lat: 19.0680,
    lng: 72.8650,
    description: 'Subterranean station works, surface excavation, concrete batching, and muck disposal transit.',
    knownMitigationRequirements: [
      '20-foot perimeter geotextile barricades around active shafts',
      'Mist cannon deployment during muck transfer operations',
      'Night-time mechanical road sweeping on adjacent avenues'
    ]
  },
  {
    id: 'hotspot-deonar-dumping',
    name: 'Deonar Municipal Solid Waste Landfill & Processing Plant',
    category: 'WASTE_DUMPING_GROUND',
    ward: 'M/E',
    lat: 19.0620,
    lng: 72.9180,
    description: '132-hectare unengineered landfill receiving legacy waste; susceptible to subsurface methane smoldering.',
    knownMitigationRequirements: [
      'Thermal perimeter camera surveillance for hot spot detection',
      'Methane extraction and daily soil capping of working faces',
      'Prohibition of open waste burning in adjacent slum settlements'
    ]
  },
  {
    id: 'hotspot-mahul-refineries',
    name: 'Mahul Petrochemical & Industrial Corridor',
    category: 'INDUSTRIAL_CLUSTER',
    ward: 'M/W',
    lat: 19.0280,
    lng: 72.8980,
    description: 'Petroleum refining complexes, chemical storage terminal tanks, and maritime tanker unloading.',
    knownMitigationRequirements: [
      'Continuous Stack Emission Monitoring Systems (CEMS) compliance',
      'VOC leak detection and repair (LDAR) program audits',
      'Flaring minimization protocols during thermal inversions'
    ]
  },
  {
    id: 'hotspot-kanjurmarg-landfill',
    name: 'Kanjurmarg Integrated Solid Waste Management Facility',
    category: 'WASTE_DUMPING_GROUND',
    ward: 'S',
    lat: 19.1410,
    lng: 72.9410,
    description: 'Engineered bioreactor landfill and composting plant handling municipal solid waste from North Mumbai.',
    knownMitigationRequirements: [
      'Bio-filter maintenance on composting windrows',
      'Leachate aeration basin odor and particulate suppression'
    ]
  },
  {
    id: 'hotspot-chakala-midc',
    name: 'Chakala & Marol MIDC Industrial Zone',
    category: 'INDUSTRIAL_CLUSTER',
    ward: 'K/E',
    lat: 19.1230,
    lng: 72.8690,
    description: 'Dense concentration of packaging units, chemical formulation labs, and commercial diesel generator fleets.',
    knownMitigationRequirements: [
      'Boiler fuel transition from furnace oil to PNG / agro-pellets',
      'Acoustic and particulate particulate scrubbers on standby DG sets'
    ]
  }
];
