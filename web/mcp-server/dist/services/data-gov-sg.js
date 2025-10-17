// Cache for hawker centres data (refresh every 24 hours)
let cachedHawkers = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export async function fetchHawkerCentres() {
    // Return cached data if still valid
    if (cachedHawkers && Date.now() - cacheTimestamp < CACHE_DURATION) {
        console.error('[MCP] Using cached hawker centres data');
        return cachedHawkers;
    }
    console.error('[MCP] Fetching fresh hawker centres data from data.gov.sg...');
    try {
        // Step 1: Poll download endpoint to get actual data URL
        const pollResponse = await fetch('https://api-open.data.gov.sg/v1/public/api/datasets/d_4a086da0a5553be1d89383cd90d07ecd/poll-download');
        if (!pollResponse.ok) {
            throw new Error(`Failed to fetch hawker data: ${pollResponse.statusText}`);
        }
        const pollData = await pollResponse.json();
        const downloadUrl = pollData.data.url;
        // Step 2: Fetch actual GeoJSON data
        const dataResponse = await fetch(downloadUrl);
        if (!dataResponse.ok) {
            throw new Error(`Failed to download hawker data: ${dataResponse.statusText}`);
        }
        const geojson = await dataResponse.json();
        // Step 3: Parse GeoJSON features
        const hawkers = geojson.features.map((feature) => ({
            name: feature.properties.NAME,
            address: `${feature.properties.ADDRESSBLOCKHOUSENUMBER} ${feature.properties.ADDRESSSTREETNAME}`,
            postalCode: feature.properties.ADDRESSPOSTALCODE || '',
            latitude: feature.geometry.coordinates[1], // GeoJSON is [lng, lat]
            longitude: feature.geometry.coordinates[0],
            description: feature.properties.DESCRIPTION || '',
            status: feature.properties.STATUS || 'Unknown',
            stallCount: feature.properties.NUMBER_OF_COOKED_FOOD_STALLS || 0,
            photoUrl: feature.properties.PHOTOURL || '',
        }));
        cachedHawkers = hawkers;
        cacheTimestamp = Date.now();
        console.error(`[MCP] Successfully fetched ${hawkers.length} hawker centres`);
        return hawkers;
    }
    catch (error) {
        console.error('[MCP] Error fetching hawker centres:', error);
        // Return cached data if available, even if stale
        if (cachedHawkers && cachedHawkers.length > 0) {
            console.error('[MCP] Using stale cached data due to fetch error');
            return cachedHawkers;
        }
        // Return empty array if no cache available
        return [];
    }
}
// Cache for closures data (refresh every 1 hour)
let cachedClosures = null;
let closureCacheTimestamp = 0;
const CLOSURE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
export async function fetchHawkerClosures() {
    // Return cached data if still valid
    if (cachedClosures && Date.now() - closureCacheTimestamp < CLOSURE_CACHE_DURATION) {
        console.error('[MCP] Using cached closures data');
        return cachedClosures;
    }
    console.error('[MCP] Fetching hawker closures from data.gov.sg...');
    try {
        const response = await fetch('https://data.gov.sg/api/action/datastore_search?resource_id=d_bda4baa634dd1cc7a6c7cad5f19e2d68&limit=1000');
        if (!response.ok) {
            throw new Error(`Failed to fetch closures: ${response.statusText}`);
        }
        const data = await response.json();
        const closures = data.result.records.map((record) => ({
            name: record.name || '',
            quarter: record.quarter || '',
            closureDates: record.closure_dates || '',
            reason: record.reason || 'Scheduled closure',
        }));
        cachedClosures = closures;
        closureCacheTimestamp = Date.now();
        console.error(`[MCP] Successfully fetched ${closures.length} closure records`);
        return closures;
    }
    catch (error) {
        console.error('[MCP] Error fetching closures:', error);
        return [];
    }
}
